import { TOOL_DEFINITIONS } from "@shopbench/tools";

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
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
  "bytedance-seed/seed-2.0-mini",
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
  private reasoningEffort?: "low" | "medium" | "high" | "xhigh";

  constructor(config: OpenRouterConfig) {
    this.config = config;
    this.reasoningEffort = config.reasoningEffort;
    this.reasoning = needsReasoning(config.model) || Boolean(config.reasoningEffort);
  }

  async chat(messages: Message[], maxRetries = 3): Promise<ChatResponse> {
    const url = `${this.config.baseUrl ?? "https://openrouter.ai/api/v1"}/chat/completions`;

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      tools: TOOL_DEFINITIONS,
      tool_choice: "auto",
    };

    // Models in REASONING_MODELS require this parameter.
    if (this.reasoning) {
      const reasoningBody: { enabled: true; effort?: "low" | "medium" | "high" | "xhigh" } = { enabled: true };
      if (this.reasoningEffort) {
        reasoningBody.effort = this.reasoningEffort;
      }
      body.reasoning = reasoningBody;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
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
          const status = res.status;
          // 4xx client errors (except 429 rate limit) are not retryable
          if (status >= 400 && status < 500 && status !== 429) {
            throw new Error(`OpenRouter API error ${status}: ${text}`);
          }
          throw new Error(`OpenRouter API error ${status} (retryable): ${text}`);
        }

        const data = (await res.json()) as ChatResponse;

        // API returned 200 but no choices (e.g. upstream model error)
        if (!data.choices) {
          const errDetail = (data as unknown as Record<string, unknown>).error ?? JSON.stringify(data);
          throw new Error(`API returned no choices: ${typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail)}`);
        }

        if (data.usage) {
          this.totalTokens += data.usage.prompt_tokens + data.usage.completion_tokens;
        }
        return data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Don't retry non-retryable errors
        if (lastError.message.includes('API error 4') && !lastError.message.includes('(retryable)')) {
          throw lastError;
        }

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * 2 ** (attempt - 1), 10000); // 1s, 2s, 4s... max 10s
          console.warn(`  [Retry ${attempt}/${maxRetries}] ${lastError.message.slice(0, 120)} — retrying in ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError ?? new Error("All retries exhausted");
  }

  getTotalTokens(): number {
    return this.totalTokens;
  }
}

export type { Message, ChatResponse };
