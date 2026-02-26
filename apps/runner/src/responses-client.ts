/**
 * OpenRouter Responses API client for models that don't support Chat Completions API
 * (e.g. OpenAI GPT-5 codex series).
 *
 * Translates between Chat Completions message format (used by runner.ts)
 * and Responses API input/output format.
 */

import { TOOL_DEFINITIONS } from "@shopbench/tools";
import type { Message, ChatResponse } from "./openrouter.js";

export interface ResponsesConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

/* ─── Responses API types ─── */

interface ResponsesInputItem {
  type: string;
  role?: string;
  content?: unknown;
  id?: string;
  call_id?: string;
  name?: string;
  arguments?: string;
  output?: string;
}

interface ResponsesOutputItem {
  type: string;
  id?: string;
  call_id?: string;
  name?: string;
  arguments?: string;
  content?: { type: string; text: string }[];
  role?: string;
  status?: string;
}

interface ResponsesAPIResponse {
  id: string;
  object: string;
  output: ResponsesOutputItem[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  status: string;
  error?: unknown;
}

/* ─── Tool definitions in Responses API format (flattened) ─── */

function convertToolDefs() {
  return TOOL_DEFINITIONS.map(td => ({
    type: "function" as const,
    name: td.function.name,
    description: td.function.description,
    parameters: td.function.parameters,
  }));
}

/* ─── Convert Chat Completions messages → Responses API input ─── */

function messagesToInput(messages: Message[]): { instructions: string | undefined; input: ResponsesInputItem[] } {
  let instructions: string | undefined;
  const input: ResponsesInputItem[] = [];

  for (const msg of messages) {
    switch (msg.role) {
      case "system":
        // System messages become the `instructions` parameter
        instructions = msg.content ?? "";
        break;

      case "user":
        input.push({
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: msg.content ?? "" }],
        });
        break;

      case "assistant":
        // If it has tool_calls, emit function_call items
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          // Emit text content as a message if present
          if (msg.content) {
            input.push({
              type: "message",
              role: "assistant",
              content: [{ type: "output_text", text: msg.content }],
            });
          }
          // Emit each tool call as a function_call item
          for (const tc of msg.tool_calls) {
            input.push({
              type: "function_call",
              id: tc.id,
              call_id: tc.id,
              name: tc.function.name,
              arguments: tc.function.arguments,
            });
          }
        } else if (msg.content) {
          input.push({
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: msg.content }],
          });
        }
        break;

      case "tool":
        // Tool results become function_call_output items
        input.push({
          type: "function_call_output",
          call_id: msg.tool_call_id ?? "",
          output: msg.content ?? "",
        });
        break;
    }
  }

  return { instructions, input };
}

/* ─── Convert Responses API output → Chat Completions response ─── */

function outputToChatResponse(resp: ResponsesAPIResponse): ChatResponse {
  const toolCalls: { id: string; type: "function"; function: { name: string; arguments: string } }[] = [];
  let textContent = "";

  for (const item of resp.output) {
    if (item.type === "function_call" && item.name && item.arguments !== undefined) {
      toolCalls.push({
        id: item.call_id ?? item.id ?? `call_${Math.random().toString(36).slice(2, 10)}`,
        type: "function",
        function: {
          name: item.name,
          arguments: item.arguments,
        },
      });
    } else if (item.type === "message" && item.content) {
      for (const part of item.content) {
        if (part.type === "output_text" && part.text) {
          textContent += part.text;
        }
      }
    }
  }

  const finishReason = toolCalls.length > 0 ? "tool_calls" : "stop";

  return {
    choices: [
      {
        message: {
          role: "assistant",
          content: textContent || undefined,
          tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
        },
        finish_reason: finishReason,
      },
    ],
    usage: resp.usage
      ? {
          prompt_tokens: resp.usage.input_tokens,
          completion_tokens: resp.usage.output_tokens,
          total_tokens: resp.usage.total_tokens,
        }
      : undefined,
  };
}

/* ─── Client ─── */

export class ResponsesClient {
  private config: ResponsesConfig;
  private totalTokens = 0;
  private tools = convertToolDefs();

  constructor(config: ResponsesConfig) {
    this.config = config;
  }

  async chat(messages: Message[]): Promise<ChatResponse> {
    const url = `${this.config.baseUrl ?? "https://openrouter.ai/api/v1"}/responses`;

    const { instructions, input } = messagesToInput(messages);

    const body: Record<string, unknown> = {
      model: this.config.model,
      input,
      tools: this.tools,
      tool_choice: "auto",
    };
    if (instructions) {
      body.instructions = instructions;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
        "HTTP-Referer": "https://shopbench.dev",
        "X-Title": "ShopBench",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenRouter Responses API error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as ResponsesAPIResponse;
    if (data.usage) {
      this.totalTokens += data.usage.input_tokens + data.usage.output_tokens;
    }

    return outputToChatResponse(data);
  }

  getTotalTokens(): number {
    return this.totalTokens;
  }
}
