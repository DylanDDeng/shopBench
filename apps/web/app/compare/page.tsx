import { getAllResults, computeDerivedMetrics, getModelDisplayName, getModelColor, formatYen, formatPct } from "@/lib/data";
import { CompareContent } from "./CompareContent";

export default function ComparePage() {
  const results = getAllResults();
  const derivedMetrics = results.map(r => computeDerivedMetrics(r));

  const models = results.map((r, i) => ({
    id: r.id,
    name: getModelDisplayName(r.model),
    color: getModelColor(i),
    result: r,
    dm: derivedMetrics[i],
  }));

  // Radar data: normalize key metrics to 0-100 scale
  const maxRevenue = Math.max(...derivedMetrics.map(d => d.totalRevenue), 1);
  const maxCash = Math.max(...results.map(r => r.metrics.finalCash), 1);
  const maxSat = Math.max(...results.map(r => r.metrics.customerSatisfactionTrend[r.metrics.customerSatisfactionTrend.length - 1] ?? 0), 1);
  const maxMargin = Math.max(...derivedMetrics.map(d => d.grossMargin), 0.01);
  const maxClearance = Math.max(...derivedMetrics.map(d => d.inventoryClearanceRate), 0.01);
  const minErrorRate = Math.min(...derivedMetrics.map(d => d.errorRate));

  const radarData = [
    { metric: "Revenue", ...Object.fromEntries(models.map(m => [m.name, Math.round(m.dm.totalRevenue / maxRevenue * 100)])) },
    { metric: "Final Cash", ...Object.fromEntries(models.map(m => [m.name, Math.round(m.result.metrics.finalCash / maxCash * 100)])) },
    { metric: "Satisfaction", ...Object.fromEntries(models.map(m => [m.name, Math.round((m.result.metrics.customerSatisfactionTrend[m.result.metrics.customerSatisfactionTrend.length - 1] ?? 0) / maxSat * 100)])) },
    { metric: "Gross Margin", ...Object.fromEntries(models.map(m => [m.name, Math.round(m.dm.grossMargin / maxMargin * 100)])) },
    { metric: "Clearance", ...Object.fromEntries(models.map(m => [m.name, Math.round(m.dm.inventoryClearanceRate / maxClearance * 100)])) },
    { metric: "Accuracy", ...Object.fromEntries(models.map(m => [m.name, Math.round((1 - m.dm.errorRate) * 100)])) },
  ];

  // Financial: cumulative profit over time
  const maxDays = 30;
  const cumulativeProfitData = Array.from({ length: maxDays }, (_, i) => {
    const point: Record<string, unknown> = { day: i + 1 };
    for (const m of models) {
      let cum = 0;
      for (let j = 0; j <= i && j < m.result.metrics.dailyProfitTrend.length; j++) {
        cum += m.result.metrics.dailyProfitTrend[j];
      }
      point[m.name] = Math.round(cum);
    }
    return point;
  });

  const dailyCashData = Array.from({ length: maxDays }, (_, i) => {
    const point: Record<string, unknown> = { day: i + 1 };
    for (const m of models) {
      point[m.name] = Math.round(m.dm.dailyCash[i] ?? 0);
    }
    return point;
  });

  // Purchasing: spend by phase
  const purchasingData = [
    { phase: "Early (D1-10)", ...Object.fromEntries(models.map(m => [m.name, Math.round(m.dm.spendByPhase.early)])) },
    { phase: "Mid (D11-20)", ...Object.fromEntries(models.map(m => [m.name, Math.round(m.dm.spendByPhase.mid)])) },
    { phase: "Late (D21-30)", ...Object.fromEntries(models.map(m => [m.name, Math.round(m.dm.spendByPhase.late)])) },
  ];

  // Inventory: inventory value over time
  const inventoryValueData = Array.from({ length: maxDays }, (_, i) => {
    const point: Record<string, unknown> = { day: i + 1 };
    for (const m of models) {
      point[m.name] = Math.round(m.dm.dailyInventoryValue[i] ?? 0);
    }
    return point;
  });

  // Tool usage: calls per day
  const toolCallsPerDay = Array.from({ length: maxDays }, (_, i) => {
    const point: Record<string, unknown> = { day: i + 1 };
    for (const m of models) {
      point[m.name] = m.dm.callsPerDay[i] ?? 0;
    }
    return point;
  });

  // Tool breakdown: aggregate all tool types across models
  const allTools = new Set<string>();
  for (const m of models) {
    for (const key of Object.keys(m.dm.callsByType)) allTools.add(key);
  }
  const toolBreakdownData = Array.from(allTools).map(tool => {
    const point: Record<string, unknown> = { tool };
    for (const m of models) {
      point[m.name] = m.dm.callsByType[tool] ?? 0;
    }
    return point;
  }).sort((a, b) => {
    const totalA = models.reduce((s, m) => s + ((a[m.name] as number) ?? 0), 0);
    const totalB = models.reduce((s, m) => s + ((b[m.name] as number) ?? 0), 0);
    return totalB - totalA;
  });

  // End-game data
  const endGameData = models.map(m => ({
    model: m.name,
    purchases: m.dm.last5DaysPurchases,
    promotions: m.dm.last5DaysPromotions,
    clearanceRate: Math.round(m.dm.clearanceRate * 100),
    endInventory: Math.round(m.dm.endInventoryValue),
  }));

  // Summary table
  const summaryTable = models.map(m => ({
    name: m.name,
    score: m.result.finalScore,
    finalCash: m.result.metrics.finalCash,
    revenue: m.dm.totalRevenue,
    grossMargin: m.dm.grossMargin,
    toolCalls: m.result.metrics.totalToolCalls,
    errorRate: m.dm.errorRate,
    clearance: m.dm.inventoryClearanceRate,
    satisfaction: m.result.metrics.customerSatisfactionTrend[m.result.metrics.customerSatisfactionTrend.length - 1] ?? 0,
  }));

  return (
    <div className="container">
      <div className="page-header">
        <h1>Model Comparison</h1>
        <p>
          Multi-dimensional comparison of AI models across financial performance, operations, and strategy
        </p>
      </div>

      {results.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>No results to compare yet. Run benchmarks for multiple models first.</p>
        </div>
      ) : (
        <CompareContent
          models={models.map(m => ({ name: m.name, color: m.color }))}
          radarData={radarData}
          summaryTable={summaryTable}
          cumulativeProfitData={cumulativeProfitData}
          dailyCashData={dailyCashData}
          purchasingData={purchasingData}
          inventoryValueData={inventoryValueData}
          toolCallsPerDay={toolCallsPerDay}
          toolBreakdownData={toolBreakdownData}
          endGameData={endGameData}
        />
      )}
    </div>
  );
}
