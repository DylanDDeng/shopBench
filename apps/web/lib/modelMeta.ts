export type ModelRegion = "cn" | "us" | "other" | "unknown";
export type ModelOpenness = "open" | "closed" | "unknown";

export interface ModelMeta {
  provider: string;
  region: ModelRegion;
  openness: ModelOpenness;
}

const PROVIDER_META: Record<string, Omit<ModelMeta, "provider">> = {
  "anthropic": { region: "us", openness: "closed" },
  "openai": { region: "us", openness: "closed" },
  "google": { region: "us", openness: "closed" },
  "x-ai": { region: "us", openness: "closed" },
  "meta-llama": { region: "us", openness: "open" },

  "qwen": { region: "cn", openness: "open" },
  "deepseek": { region: "cn", openness: "open" },
  "moonshotai": { region: "cn", openness: "open" },
  "minimax": { region: "cn", openness: "open" },
  "stepfun": { region: "cn", openness: "open" },
  "z-ai": { region: "cn", openness: "open" },
};

export function getModelMeta(modelId: string): ModelMeta {
  const provider = (modelId.split("/")[0] ?? "").toLowerCase();
  const known = PROVIDER_META[provider];
  if (known) return { provider, ...known };
  return { provider: provider || "unknown", region: "unknown", openness: "unknown" };
}
