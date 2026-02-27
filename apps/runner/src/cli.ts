#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { runSimulation } from "./runner.js";
import { generateReport } from "@shopbench/scoring";
import type { ScenarioConfig } from "@shopbench/engine";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");

function usage() {
  console.log(`
ShopBench — AI Business Simulation Benchmark

Usage:
  shopbench --model <model_id> [options]

Options:
  --model, -m     Model ID (e.g. "openai/gpt-4o", "anthropic/claude-3.5-sonnet")
  --scenario, -s  Scenario file path (default: scenarios/base.json)
  --api-key, -k   OpenRouter API key (or set OPENROUTER_API_KEY env var)
  --base-url      OpenRouter base URL (default: https://openrouter.ai/api/v1)
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

  const model = getArg(["--model", "-m"]);
  if (!model) {
    console.error("Error: --model is required");
    process.exit(1);
  }

  const apiKey = getArg(["--api-key", "-k"]) ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("Error: API key required. Use --api-key or set OPENROUTER_API_KEY");
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
  const baseUrl = getArg(["--base-url"]);
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
  console.log(`Scenario: ${scenario.name} (${scenario.totalDays} days)`);
  console.log(`Starting cash: ¥${scenario.startingCash}`);
  console.log(`─────────────────────────────────`);

  const result = await runSimulation({
    scenario,
    model,
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
