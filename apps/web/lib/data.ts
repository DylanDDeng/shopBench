import "server-only";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { computeDerivedMetrics, getModelDisplayName, type AggregatedLeaderboardEntry, type DerivedMetrics, type SimulationResult } from "./types";

// Re-export everything from types for server components
export * from "./types";

/* ─── Data Loading (server-only) ─── */

const DATA_DIR = resolve(process.cwd(), "data");
const LEADERBOARD_RECENT_RUN_LIMIT = 5;

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

function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const weight = position - lower;

  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function getStabilityBand(iqr: number): AggregatedLeaderboardEntry["stabilityBand"] {
  if (iqr <= 1500) return "stable";
  if (iqr <= 3000) return "medium";
  return "volatile";
}

function selectMedianRun(
  pairs: { result: SimulationResult; derived: DerivedMetrics }[],
  medianScore: number,
): { result: SimulationResult; derived: DerivedMetrics } {
  return pairs.reduce((best, candidate) => {
    const bestDelta = Math.abs(best.result.finalScore - medianScore);
    const candidateDelta = Math.abs(candidate.result.finalScore - medianScore);
    if (candidateDelta < bestDelta) return candidate;
    if (candidateDelta > bestDelta) return best;
    return candidate.result.completedAt > best.result.completedAt ? candidate : best;
  });
}

export function getAggregatedLeaderboard(results: SimulationResult[] = getAllResults()): AggregatedLeaderboardEntry[] {
  const groups = new Map<string, { displayName: string; pairs: { result: SimulationResult; derived: DerivedMetrics }[] }>();

  for (const result of results) {
    const displayName = getModelDisplayName(result.model);
    const key = displayName.toLowerCase();
    const derived = computeDerivedMetrics(result);
    const group = groups.get(key);

    if (group) {
      group.pairs.push({ result, derived });
    } else {
      groups.set(key, { displayName, pairs: [{ result, derived }] });
    }
  }

  return [...groups.values()]
    .map(({ displayName, pairs }) => {
      const recentPairs = [...pairs]
        .sort((a, b) => Date.parse(b.result.completedAt) - Date.parse(a.result.completedAt))
        .slice(0, LEADERBOARD_RECENT_RUN_LIMIT);
      const scores = recentPairs.map(pair => pair.result.finalScore);
      const grossMargins = recentPairs.map(pair => pair.derived.grossMargin);
      const errorRates = recentPairs.map(pair => pair.derived.errorRate);
      const medianFinalScore = quantile(scores, 0.5);
      const finalScoreIqr = quantile(scores, 0.75) - quantile(scores, 0.25);
      const medianRun = selectMedianRun(recentPairs, medianFinalScore);
      const bestRun = recentPairs.reduce((best, candidate) => candidate.result.finalScore > best.result.finalScore ? candidate : best);
      const worstRun = recentPairs.reduce((worst, candidate) => candidate.result.finalScore < worst.result.finalScore ? candidate : worst);

      return {
        model: medianRun.result.model,
        displayName,
        runCount: recentPairs.length,
        positiveRunCount: scores.filter(score => score > 0).length,
        positiveRunRate: scores.filter(score => score > 0).length / recentPairs.length,
        medianFinalScore,
        finalScoreIqr,
        medianGrossMargin: quantile(grossMargins, 0.5),
        medianErrorRate: quantile(errorRates, 0.5),
        stabilityBand: getStabilityBand(finalScoreIqr),
        medianRunId: medianRun.result.id,
        bestRunId: bestRun.result.id,
        worstRunId: worstRun.result.id,
      } satisfies AggregatedLeaderboardEntry;
    })
    .sort((a, b) => b.medianFinalScore - a.medianFinalScore);
}
