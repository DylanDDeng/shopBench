export type ModelRegion = "cn" | "us" | "other" | "unknown";
export type ModelOpenness = "open" | "closed" | "unknown";

export interface ModelMeta {
  provider: string;
  region: ModelRegion;
  openness: ModelOpenness;
}

const MODEL_ID_META: Record<string, ModelMeta> = {
  "gpt-5.3-codex-xhigh": { provider: "openai", region: "us", openness: "closed" },
  "gpt-5.3-xhigh": { provider: "openai", region: "us", openness: "closed" },
  "gpt-5.3-codex-xhgih": { provider: "openai", region: "us", openness: "closed" },
  "gpt-5.3-xhgih": { provider: "openai", region: "us", openness: "closed" },
};

const PROVIDER_META: Record<string, Omit<ModelMeta, "provider">> = {
  "anthropic": { region: "us", openness: "closed" },
  "openai": { region: "us", openness: "closed" },
  "google": { region: "us", openness: "closed" },
  "x-ai": { region: "us", openness: "closed" },
  "meta-llama": { region: "us", openness: "open" },
  "bytedance-seed": { region: "cn", openness: "closed" },
  "doubao": { region: "cn", openness: "closed" },

  "qwen": { region: "cn", openness: "open" },
  "deepseek": { region: "cn", openness: "open" },
  "moonshotai": { region: "cn", openness: "open" },
  "minimax": { region: "cn", openness: "open" },
  "stepfun": { region: "cn", openness: "open" },
  "z-ai": { region: "cn", openness: "open" },
};

export function getModelMeta(modelId: string): ModelMeta {
  const normalizedId = modelId.toLowerCase();
  const direct = MODEL_ID_META[normalizedId];
  if (direct) return direct;

  const provider = (normalizedId.split("/")[0] ?? "").toLowerCase();
  const known = PROVIDER_META[provider];
  if (known) return { provider, ...known };

  if (normalizedId.startsWith("gpt-")) {
    return { provider: "openai", region: "us", openness: "closed" };
  }
  if (normalizedId.startsWith("doubao-")) {
    return { provider: "bytedance-seed", region: "cn", openness: "closed" };
  }
  if (normalizedId.startsWith("bytedance-seed/")) {
    return { provider: "bytedance-seed", region: "cn", openness: "closed" };
  }

  return { provider: provider || "unknown", region: "unknown", openness: "unknown" };
}
