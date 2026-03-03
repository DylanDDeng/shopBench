#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { runSimulation } from "./runner.js";
import { generateReport } from "@shopbench/scoring";
import type { ScenarioConfig } from "@shopbench/engine";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");
type ReasoningEffort = "low" | "medium" | "high" | "xhigh";
type Provider = "openrouter" | "ark";

interface ModelPreset {
  providerModel: string;
  reasoningEffort?: ReasoningEffort;
  reasoningEnabled?: boolean;
}

const MODEL_PRESETS: Record<string, ModelPreset> = {
  // Preferred alias: show as custom label, but call OpenRouter with codex ID at xhigh effort
  "gpt-5.3-codex-xhigh": { providerModel: "openai/gpt-5.3-codex", reasoningEffort: "xhigh" },
  "gpt-5.3-xhigh": { providerModel: "openai/gpt-5.3-codex", reasoningEffort: "xhigh" },
  // Backward-compatible typo aliases
  "gpt-5.3-codex-xhgih": { providerModel: "openai/gpt-5.3-codex", reasoningEffort: "xhigh" },
  "gpt-5.3-xhgih": { providerModel: "openai/gpt-5.3-codex", reasoningEffort: "xhigh" },
  // DeepSeek thinking alias:
  // - show model as deepseek-v3.2-thinking in result/UI
  // - call OpenRouter with base ID deepseek/deepseek-v3.2
  // - force reasoning.enabled=true
  "deepseek-v3.2-thinking": { providerModel: "deepseek/deepseek-v3.2", reasoningEnabled: true },
  "deepseek/deepseek-v3.2-thinking": { providerModel: "deepseek/deepseek-v3.2", reasoningEnabled: true },
};

function isClaudeModelId(modelId: string): boolean {
  return modelId.toLowerCase().startsWith("anthropic/claude-");
}

function stripThinkingSuffix(modelId: string): string {
  return modelId.replace(/-thinking$/i, "");
}

function usage() {
  console.log(`
ShopBench — AI Business Simulation Benchmark

Usage:
  shopbench --model <model_id> [options]

Options:
  --model, -m     Model ID (e.g. "openai/gpt-4o", "anthropic/claude-3.5-sonnet")
  --provider      Provider: openrouter | ark (default: openrouter)
  --provider-model  Actual provider model ID to call (defaults to --model)
  --openrouter-model Legacy alias of --provider-model
  --thinking       Enable model thinking/reasoning mode
  --no-thinking    Disable model thinking/reasoning mode
  --reasoning-effort  Reasoning effort: low | medium | high | xhigh
  --tool-schema-strict     Enable strict tool schema
  --no-tool-schema-strict  Disable strict tool schema
  --parallel-tool-calls    Enable parallel tool calls
  --no-parallel-tool-calls Disable parallel tool calls
  --scenario, -s  Scenario file path (default: scenarios/base.json)
  --api-key, -k   API key (OPENROUTER_API_KEY or ARK_API_KEY)
  --base-url      API base URL (defaults by provider)
  --output, -o    Output directory (default: data/)
  --verbose, -v   Verbose output
  --help, -h      Show this help
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    usage();
    process.exit(0);
  }

  const getArg = (flags: string[]): string | undefined => {
    for (const flag of flags) {
      const idx = args.indexOf(flag);
      if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
    }
    return undefined;
  };

  const modelArg = getArg(["--model", "-m"]);
  if (!modelArg) {
    console.error("Error: --model is required");
    process.exit(1);
  }
  const isClaudeThinking = isClaudeModelId(modelArg) && /-thinking$/i.test(modelArg);
  const baseModelArg = isClaudeThinking ? stripThinkingSuffix(modelArg) : modelArg;
  const model = modelArg;
  const baseUrl = getArg(["--base-url"]);

  const providerArg = getArg(["--provider"]);
  let provider: Provider =
    (baseUrl ?? "").toLowerCase().includes("volces.com")
      ? "ark"
      : "openrouter";
  if (providerArg) {
    const normalized = providerArg.toLowerCase();
    if (normalized !== "openrouter" && normalized !== "ark") {
      console.error(`Error: invalid --provider "${providerArg}". Use openrouter|ark.`);
      process.exit(1);
    }
    provider = normalized as Provider;
  }

  const preset = MODEL_PRESETS[baseModelArg.toLowerCase()] ?? MODEL_PRESETS[modelArg.toLowerCase()];
  const providerModel = getArg(["--provider-model", "--openrouter-model"]) ?? preset?.providerModel ?? baseModelArg;

  // Claude dual mode:
  // - anthropic/claude-xxx => reasoning disabled
  // - anthropic/claude-xxx-thinking => reasoning enabled (while calling base OpenRouter ID)
  let reasoningEnabled: boolean | undefined = preset?.reasoningEnabled;
  if (reasoningEnabled === undefined && provider === "openrouter" && isClaudeModelId(baseModelArg)) {
    reasoningEnabled = isClaudeThinking;
  }
  const thinkingOn = args.includes("--thinking");
  const thinkingOff = args.includes("--no-thinking");
  if (thinkingOn && thinkingOff) {
    console.error("Error: use only one of --thinking or --no-thinking.");
    process.exit(1);
  }
  if (thinkingOn) reasoningEnabled = true;
  if (thinkingOff) reasoningEnabled = false;

  const effortArg = getArg(["--reasoning-effort"]);
  let reasoningEffort: ReasoningEffort | undefined = preset?.reasoningEffort;
  if (effortArg) {
    const normalized = effortArg.toLowerCase();
    if (normalized !== "low" && normalized !== "medium" && normalized !== "high" && normalized !== "xhigh") {
      console.error(`Error: invalid --reasoning-effort "${effortArg}". Use low|medium|high|xhigh.`);
      process.exit(1);
    }
    reasoningEffort = normalized as ReasoningEffort;
  }

  const strictOn = args.includes("--tool-schema-strict");
  const strictOff = args.includes("--no-tool-schema-strict");
  if (strictOn && strictOff) {
    console.error("Error: use only one of --tool-schema-strict or --no-tool-schema-strict.");
    process.exit(1);
  }

  const parallelOn = args.includes("--parallel-tool-calls");
  const parallelOff = args.includes("--no-parallel-tool-calls");
  if (parallelOn && parallelOff) {
    console.error("Error: use only one of --parallel-tool-calls or --no-parallel-tool-calls.");
    process.exit(1);
  }

  // Defaults follow standard OpenRouter behavior:
  // - no strict tool schema unless explicitly enabled
  // - no explicit parallel_tool_calls unless explicitly enabled
  let strictTools: boolean | undefined;
  let parallelToolCalls: boolean | undefined;
  if (strictOn) strictTools = true;
  if (strictOff) strictTools = false;
  if (parallelOn) parallelToolCalls = true;
  if (parallelOff) parallelToolCalls = false;

  const apiKey =
    getArg(["--api-key", "-k"]) ??
    (provider === "ark" ? process.env.ARK_API_KEY : process.env.OPENROUTER_API_KEY);
  if (!apiKey) {
    console.error(
      provider === "ark"
        ? "Error: API key required. Use --api-key or set ARK_API_KEY"
        : "Error: API key required. Use --api-key or set OPENROUTER_API_KEY",
    );
    process.exit(1);
  }

  const scenarioPath = getArg(["--scenario", "-s"]) ?? resolve(ROOT, "scenarios/base.json");
  const outputArg = getArg(["--output", "-o"]);
  const outputDir = outputArg
    ? isAbsolute(outputArg)
      ? outputArg
      : outputArg.startsWith("./") || outputArg.startsWith("../")
        ? resolve(process.cwd(), outputArg)
        : resolve(ROOT, outputArg)
    : resolve(ROOT, "data");
  const verbose = args.includes("--verbose") || args.includes("-v");

  // Load scenario
  let scenario: ScenarioConfig;
  try {
    scenario = JSON.parse(readFileSync(scenarioPath, "utf-8"));
  } catch (err: any) {
    console.error(`Error loading scenario: ${err.message}`);
    process.exit(1);
  }

  console.log(`ShopBench v0.1.0`);
  console.log(`Model: ${model}`);
  console.log(`Provider: ${provider}`);
  if (providerModel !== model) {
    console.log(`Provider model: ${providerModel}`);
  }
  if (reasoningEnabled !== undefined) {
    console.log(`Reasoning enabled: ${reasoningEnabled ? "true" : "false"}`);
  }
  if (reasoningEffort) {
    console.log(`Reasoning effort: ${reasoningEffort}`);
  }
  if (strictTools !== undefined) {
    console.log(`Tool schema strict: ${strictTools ? "true" : "false"}`);
  }
  if (parallelToolCalls !== undefined) {
    console.log(`Parallel tool calls: ${parallelToolCalls ? "true" : "false"}`);
  }
  console.log(`Scenario: ${scenario.name} (${scenario.totalDays} days)`);
  console.log(`Starting cash: ¥${scenario.startingCash}`);
  console.log(`─────────────────────────────────`);

  const result = await runSimulation({
    scenario,
    model,
    providerModel,
    provider,
    reasoningEnabled,
    reasoningEffort,
    strictTools,
    parallelToolCalls,
    apiKey,
    baseUrl,
    verbose,
  });

  // Save result
  mkdirSync(outputDir, { recursive: true });
  const filename = `${model.replace(/\//g, "_")}_${scenario.name}_${result.id.slice(0, 8)}.json`;
  const outputPath = resolve(outputDir, filename);
  writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\nResult saved to: ${outputPath}`);

  // Print report
  const report = generateReport(result);
  console.log(`\n${report.summary}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
