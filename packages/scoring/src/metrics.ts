import type { WorldState, DayRecord, SimulationMetrics, FinancialRecord } from "@shopbench/engine";

/**
 * Calculate all simulation metrics from the run history.
 */
export function calculateMetrics(
  history: DayRecord[],
  initialCash: number,
  inventoryLiquidationRate = 0,
): SimulationMetrics {
  const finalState = history[history.length - 1]?.stateSnapshot;
  if (!finalState) {
    return emptyMetrics();
  }

  const finalCash = finalState.cash;
  const rawInventoryValue = finalState.inventory.reduce((s, i) => s + i.quantity * i.costPerUnit, 0);
  const inventoryValue = rawInventoryValue * inventoryLiquidationRate;
  const outstandingLoans = finalState.loans.reduce((s, l) => s + l.remainingBalance, 0);
  const netProfit = finalCash + inventoryValue - initialCash - outstandingLoans;

  // Cash flow break days
  let cashFlowBreakDays = 0;
  for (const day of history) {
    if (day.stateSnapshot.cash < 0) cashFlowBreakDays++;
  }

  // Inventory waste rate
  let totalExpired = 0;
  let totalSold = 0;
  for (const day of history) {
    totalExpired += day.settlement.expiredItems.reduce((s, e) => s + e.quantity, 0);
    totalSold += day.settlement.itemsSold.reduce((s, e) => s + e.quantity, 0);
  }
  const inventoryWasteRate = (totalSold + totalExpired) > 0
    ? totalExpired / (totalSold + totalExpired)
    : 0;

  // Bankruptcy check
  const bankruptcyTriggered = history.some(d => d.stateSnapshot.cash < -5000);

  // Total tool calls
  const totalToolCalls = history.reduce((s, d) => s + d.toolCalls.length, 0);

  // Daily profit trend
  const dailyProfitTrend = history.map(d => d.settlement.netProfit);
  const avgDailyProfit = dailyProfitTrend.reduce((s, p) => s + p, 0) / (dailyProfitTrend.length || 1);

  // Customer satisfaction trend
  const customerSatisfactionTrend = history.map(d => d.stateSnapshot.customerSatisfaction);

  // Reputation trend
  const reputationTrend = history.map(d => d.stateSnapshot.reputation);

  return {
    netProfit: round2(netProfit),
    finalCash: round2(finalCash),
    inventoryValue: round2(inventoryValue),
    outstandingLoans: round2(outstandingLoans),
    cashFlowBreakDays,
    inventoryWasteRate: round2(inventoryWasteRate),
    bankruptcyTriggered,
    totalToolCalls,
    avgDailyProfit: round2(avgDailyProfit),
    customerSatisfactionTrend,
    reputationTrend,
    dailyProfitTrend,
  };
}

/**
 * Primary score: net profit (determines ranking).
 */
export function calculateScore(metrics: SimulationMetrics): number {
  return metrics.netProfit;
}

function emptyMetrics(): SimulationMetrics {
  return {
    netProfit: 0,
    finalCash: 0,
    inventoryValue: 0,
    outstandingLoans: 0,
    cashFlowBreakDays: 0,
    inventoryWasteRate: 0,
    bankruptcyTriggered: false,
    totalToolCalls: 0,
    avgDailyProfit: 0,
    customerSatisfactionTrend: [],
    reputationTrend: [],
    dailyProfitTrend: [],
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
