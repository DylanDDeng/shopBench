import { notFound } from "next/navigation";
import { getAllResults, computeDerivedMetrics, getModelDisplayName, getModelColor } from "@/lib/data";
import { CompareContent } from "@/app/compare/CompareContent";
import { isLocale } from "@/lib/i18n";

export default async function LocalizedComparePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const isZh = locale === "zh";
  const text = isZh
    ? {
        title: "模型对比",
        subtitle: "从财务表现、运营效率与策略执行三个维度对比不同 AI 模型",
        noResults: "暂无可对比结果。请先运行多个模型的 benchmark。",
        revenue: "收入",
        finalCash: "期末现金",
        satisfaction: "满意度",
        grossMargin: "毛利率",
        clearance: "清仓率",
        accuracy: "执行准确度",
        early: "早期 (D1-10)",
        mid: "中期 (D11-20)",
        late: "后期 (D21-30)",
      }
    : {
        title: "Model Comparison",
        subtitle: "Multi-dimensional comparison of AI models across financial performance, operations, and strategy",
        noResults: "No results to compare yet. Run benchmarks for multiple models first.",
        revenue: "Revenue",
        finalCash: "Final Cash",
        satisfaction: "Satisfaction",
        grossMargin: "Gross Margin",
        clearance: "Clearance",
        accuracy: "Accuracy",
        early: "Early (D1-10)",
        mid: "Mid (D11-20)",
        late: "Late (D21-30)",
      };

  const results = getAllResults();
  const derivedMetrics = results.map(r => computeDerivedMetrics(r));

  const models = results.map((r, i) => ({
    id: r.id,
    name: getModelDisplayName(r.model),
    color: getModelColor(i),
    result: r,
    dm: derivedMetrics[i],
  }));

  const maxRevenue = Math.max(...derivedMetrics.map(d => d.totalRevenue), 1);
  const maxCash = Math.max(...results.map(r => r.metrics.finalCash), 1);
  const maxSat = Math.max(...results.map(r => r.metrics.customerSatisfactionTrend[r.metrics.customerSatisfactionTrend.length - 1] ?? 0), 1);
  const maxMargin = Math.max(...derivedMetrics.map(d => d.grossMargin), 0.01);
  const maxClearance = Math.max(...derivedMetrics.map(d => d.inventoryClearanceRate), 0.01);

  const radarData = [
    { metric: text.revenue, ...Object.fromEntries(models.map(m => [m.name, Math.round(m.dm.totalRevenue / maxRevenue * 100)])) },
    { metric: text.finalCash, ...Object.fromEntries(models.map(m => [m.name, Math.round(m.result.metrics.finalCash / maxCash * 100)])) },
    { metric: text.satisfaction, ...Object.fromEntries(models.map(m => [m.name, Math.round((m.result.metrics.customerSatisfactionTrend[m.result.metrics.customerSatisfactionTrend.length - 1] ?? 0) / maxSat * 100)])) },
    { metric: text.grossMargin, ...Object.fromEntries(models.map(m => [m.name, Math.round(m.dm.grossMargin / maxMargin * 100)])) },
    { metric: text.clearance, ...Object.fromEntries(models.map(m => [m.name, Math.round(m.dm.inventoryClearanceRate / maxClearance * 100)])) },
    { metric: text.accuracy, ...Object.fromEntries(models.map(m => [m.name, Math.round((1 - m.dm.errorRate) * 100)])) },
  ];

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

  const purchasingData = [
    { phase: text.early, ...Object.fromEntries(models.map(m => [m.name, Math.round(m.dm.spendByPhase.early)])) },
    { phase: text.mid, ...Object.fromEntries(models.map(m => [m.name, Math.round(m.dm.spendByPhase.mid)])) },
    { phase: text.late, ...Object.fromEntries(models.map(m => [m.name, Math.round(m.dm.spendByPhase.late)])) },
  ];

  const inventoryValueData = Array.from({ length: maxDays }, (_, i) => {
    const point: Record<string, unknown> = { day: i + 1 };
    for (const m of models) {
      point[m.name] = Math.round(m.dm.dailyInventoryValue[i] ?? 0);
    }
    return point;
  });

  const toolCallsPerDay = Array.from({ length: maxDays }, (_, i) => {
    const point: Record<string, unknown> = { day: i + 1 };
    for (const m of models) {
      point[m.name] = m.dm.callsPerDay[i] ?? 0;
    }
    return point;
  });

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

  const endGameData = models.map(m => ({
    model: m.name,
    purchases: m.dm.last5DaysPurchases,
    promotions: m.dm.last5DaysPromotions,
    clearanceRate: Math.round(m.dm.clearanceRate * 100),
    endInventory: Math.round(m.dm.endInventoryValue),
  }));

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
        <h1>{text.title}</h1>
        <p>{text.subtitle}</p>
      </div>

      {results.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>{text.noResults}</p>
        </div>
      ) : (
        <CompareContent
          locale={locale}
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
