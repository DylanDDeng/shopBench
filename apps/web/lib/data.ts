import "server-only";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { SimulationResult } from "./types";

// Re-export everything from types for server components
export * from "./types";

/* ─── Data Loading (server-only) ─── */

const DATA_DIR = resolve(process.cwd(), "data");

export function getAllResults(): SimulationResult[] {
  try {
    const files = readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));
    return files.map(f => {
      const content = readFileSync(resolve(DATA_DIR, f), "utf-8");
      const result = JSON.parse(content) as SimulationResult;
      // Backfill reputationTrend from day snapshots if missing
      if (!result.metrics.reputationTrend) {
        result.metrics.reputationTrend = result.days.map(d => d.stateSnapshot.reputation);
      }
      return result;
    }).sort((a, b) => b.finalScore - a.finalScore);
  } catch {
    return [];
  }
}

export function getResult(id: string): SimulationResult | null {
  const results = getAllResults();
  return results.find(r => r.id === id) ?? null;
}
