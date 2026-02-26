import type { SimulationResult, SimulationMetrics } from "@shopbench/engine";

export interface Report {
  id: string;
  model: string;
  scenario: string;
  score: number;
  metrics: SimulationMetrics;
  summary: string;
  completedAt: string;
}

export function generateReport(result: SimulationResult): Report {
  const m = result.metrics;

  const lines = [
    `══════════════════════════════════════`,
    `  ShopBench Report: ${result.model}`,
    `  Scenario: ${result.scenario}`,
    `══════════════════════════════════════`,
    ``,
    `🏆 Final Score (Net Profit): ¥${m.netProfit.toFixed(2)}`,
    ``,
    `── Financial Summary ──`,
    `  Final Cash:        ¥${m.finalCash.toFixed(2)}`,
    `  Inventory Value:   ¥${m.inventoryValue.toFixed(2)}`,
    `  Outstanding Loans: ¥${m.outstandingLoans.toFixed(2)}`,
    `  Avg Daily Profit:  ¥${m.avgDailyProfit.toFixed(2)}`,
    ``,
    `── Operational Metrics ──`,
    `  Cash Flow Breaks:  ${m.cashFlowBreakDays} days`,
    `  Inventory Waste:   ${(m.inventoryWasteRate * 100).toFixed(1)}%`,
    `  Bankruptcy:        ${m.bankruptcyTriggered ? "YES ⚠️" : "No"}`,
    `  Total Tool Calls:  ${m.totalToolCalls}`,
    ``,
    `── Trends ──`,
    `  Profit Trend:      ${describeTrend(m.dailyProfitTrend)}`,
    `  Satisfaction:      ${m.customerSatisfactionTrend[0]?.toFixed(0) ?? "?"} → ${m.customerSatisfactionTrend[m.customerSatisfactionTrend.length - 1]?.toFixed(0) ?? "?"}`,
    ``,
    `══════════════════════════════════════`,
  ];

  return {
    id: result.id,
    model: result.model,
    scenario: result.scenario,
    score: result.finalScore,
    metrics: m,
    summary: lines.join("\n"),
    completedAt: result.completedAt,
  };
}

function describeTrend(values: number[]): string {
  if (values.length < 5) return "insufficient data";
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;

  if (avgSecond > avgFirst * 1.2) return "📈 Improving";
  if (avgSecond < avgFirst * 0.8) return "📉 Declining";
  return "➡️ Stable";
}

export function generateLeaderboard(results: SimulationResult[]): string {
  const sorted = [...results].sort((a, b) => b.finalScore - a.finalScore);
  const lines = [
    `╔══════════════════════════════════════════════════╗`,
    `║           ShopBench Leaderboard                  ║`,
    `╠══════════════════════════════════════════════════╣`,
  ];

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    lines.push(
      `║ ${medal} ${r.model.padEnd(25)} ¥${r.finalScore.toFixed(2).padStart(12)} ║`
    );
  }

  lines.push(`╚══════════════════════════════════════════════════╝`);
  return lines.join("\n");
}
