import { TOOL_DEFINITIONS } from "@shopbench/tools";

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
  tool_call_id?: string;
  name?: string;
  // Reasoning details returned by OpenAI reasoning models — must be
  // preserved and passed back unmodified for multi-turn conversations.
  reasoning_details?: unknown;
}

interface ChatResponse {
  choices: {
    message: {
      role: string;
      content?: string;
      tool_calls?: {
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }[];
      // Returned by OpenAI reasoning models
      reasoning_details?: unknown;
    };
    finish_reason: string;
  }[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

/**
 * Models that require `reasoning: {enabled: true}` in the request body.
 * Without this parameter these models may return empty responses.
 */
const REASONING_MODELS = [
  "openai/gpt-5.3-codex",
  "openai/gpt-5.2-codex",
  "openai/gpt-5.2",
  "openai/gpt-5.1-codex",
  "openai/gpt-5.1-codex-max",
  "openai/gpt-5.1-codex-mini",
  "openai/gpt-5.1",
  "openai/gpt-5-codex",
  "openai/gpt-5-pro",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
  "openai/codex-mini",
  "openai/o3-pro",
  "openai/o3",
  "openai/o4-mini",
  "openai/o3-mini",
  "openai/o1",
];

function needsReasoning(model: string): boolean {
  return REASONING_MODELS.some(m => model === m || model.startsWith(m + "-"));
}

export class OpenRouterClient {
  private config: OpenRouterConfig;
  private totalTokens = 0;
  private reasoning: boolean;

  constructor(config: OpenRouterConfig) {
    this.config = config;
    this.reasoning = needsReasoning(config.model);
  }

  async chat(messages: Message[]): Promise<ChatResponse> {
    const url = `${this.config.baseUrl ?? "https://openrouter.ai/api/v1"}/chat/completions`;

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      tools: TOOL_DEFINITIONS,
      tool_choice: "auto",
    };

    // OpenAI reasoning models require this parameter
    if (this.reasoning) {
      body.reasoning = { enabled: true };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`,
        "HTTP-Referer": "https://shopbench.dev",
        "X-Title": "ShopBench",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenRouter API error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as ChatResponse;
    if (data.usage) {
      this.totalTokens += data.usage.prompt_tokens + data.usage.completion_tokens;
    }
    return data;
  }

  getTotalTokens(): number {
    return this.totalTokens;
  }
}

export type { Message, ChatResponse };
