import { getResult, computeDerivedMetrics, getModelDisplayName, formatYen, formatPct, getToolLabel, getToolCategory } from "@/lib/data";
import { TOOL_CATEGORY_COLORS } from "@/lib/chartConfig";
import { MetricCard } from "@/components/MetricCard";
import { SectionHeader } from "@/components/SectionHeader";
import { ReportCharts } from "./ReportCharts";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";

const REPORT_TEXT: Record<Locale, {
  scenario: string;
  completed: string;
  score: string;
  finalCash: string;
  totalRevenue: string;
  grossMargin: string;
  toolCalls: string;
  satisfaction: string;
  reputation: string;
  operationalMetrics: string;
  cashFlowBreakDays: string;
  inventoryWasteRate: string;
  bankruptcyTriggered: string;
  outstandingLoans: string;
  avgDailyProfit: string;
  totalHiresFires: string;
  purchaseOrders: string;
  failed: string;
  priceAdjustments: string;
  revenuePerCustomer: string;
  yes: string;
  no: string;
  replayLink: string;
  summaryTitle: string;
  summaryPositive: string;
  summaryNegative: string;
  profitDays: string;
  lossDays: string;
  bestDay: string;
  worstDay: string;
  toolErrorRate: string;
}> = {
  en: {
    scenario: "Scenario",
    completed: "Completed",
    score: "Score",
    finalCash: "Final Cash",
    totalRevenue: "Total Revenue",
    grossMargin: "Gross Margin",
    toolCalls: "Tool Calls",
    satisfaction: "Satisfaction",
    reputation: "Reputation",
    operationalMetrics: "Operational Metrics",
    cashFlowBreakDays: "Cash Flow Break Days",
    inventoryWasteRate: "Inventory Waste Rate",
    bankruptcyTriggered: "Bankruptcy Triggered",
    outstandingLoans: "Outstanding Loans",
    avgDailyProfit: "Avg Daily Profit",
    totalHiresFires: "Total Hires / Fires",
    purchaseOrders: "Purchase Orders",
    failed: "failed",
    priceAdjustments: "Price Adjustments",
    revenuePerCustomer: "Revenue per Customer",
    yes: "Yes",
    no: "No",
    replayLink: "View Day-by-Day Replay",
    summaryTitle: "30-Day Executive Summary",
    summaryPositive: "Cash-positive execution profile",
    summaryNegative: "Cash-negative execution profile",
    profitDays: "Profit Days",
    lossDays: "Loss Days",
    bestDay: "Best Day",
    worstDay: "Worst Day",
    toolErrorRate: "Tool Error Rate",
  },
  zh: {
    scenario: "场景",
    completed: "完成时间",
    score: "得分",
    finalCash: "期末现金",
    totalRevenue: "总收入",
    grossMargin: "毛利率",
    toolCalls: "工具调用数",
    satisfaction: "满意度",
    reputation: "声誉",
    operationalMetrics: "运营指标",
    cashFlowBreakDays: "现金流断裂天数",
    inventoryWasteRate: "库存损耗率",
    bankruptcyTriggered: "是否触发破产",
    outstandingLoans: "未偿贷款",
    avgDailyProfit: "日均利润",
    totalHiresFires: "总招聘 / 解雇",
    purchaseOrders: "采购订单",
    failed: "失败",
    priceAdjustments: "调价次数",
    revenuePerCustomer: "单客收入",
    yes: "是",
    no: "否",
    replayLink: "查看逐日回放",
    summaryTitle: "30天经营摘要",
    summaryPositive: "净现金为正，执行稳定",
    summaryNegative: "净现金为负，经营承压",
    profitDays: "盈利天数",
    lossDays: "亏损天数",
    bestDay: "最佳单日",
    worstDay: "最差单日",
    toolErrorRate: "工具错误率",
  },
};

function formatDelta(value: number): string {
  if (!Number.isFinite(value)) return "–";
  return `${value >= 0 ? "+" : ""}${value.toFixed(0)}`;
}

export default async function ReportPage({
  params,
  locale = "en",
}: {
  params: Promise<{ id: string }>;
  locale?: Locale;
}) {
  const { id } = await params;
  const result = getResult(id);
  if (!result) notFound();
  const text = REPORT_TEXT[locale];

  const m = result.metrics;
  const dm = computeDerivedMetrics(result);

  // Build chart data
  const inferredStartingCash = m.finalCash - m.netProfit;
  const hasCashSeries = dm.dailyCash.some(v => v !== 0);
  let cumulative = 0;
  const profitChartData = m.dailyProfitTrend.map((profit, i) => {
    cumulative += profit;
    const fallbackCash = inferredStartingCash + cumulative;
    const cash = hasCashSeries ? (dm.dailyCash[i] ?? fallbackCash) : fallbackCash;
    return {
      day: i + 1,
      profit: Math.round(profit),
      cumulative: Math.round(cumulative),
      revenue: Math.round(dm.dailyRevenue[i] ?? 0),
      netCash: Math.round(cash),
    };
  });

  const inventoryChartData = dm.dailyInventoryValue.map((v, i) => ({
    day: i + 1,
    value: Math.round(v),
  }));

  // Tool usage data for horizontal bar
  const toolUsageData = Object.entries(dm.callsByType)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name: getToolLabel(name),
      value: count,
      errors: dm.errorsByType[name] ?? 0,
      color: TOOL_CATEGORY_COLORS[getToolCategory(name)] ?? "#60a5fa",
    }));

  // Tool calls per day
  const toolCallsPerDay = dm.callsPerDay.map((calls, i) => ({
    day: i + 1,
    calls,
    errors: dm.errorsPerDay[i] ?? 0,
  }));

  // Product sales table
  const productSales = Object.entries(dm.salesByProduct)
    .sort((a, b) => b[1] - a[1])
    .map(([product, revenue]) => ({
      product,
      revenue,
      expired: dm.expiredByProduct[product] ?? 0,
    }));

  // End-game: last 7 days
  const endGameDays = result.days.slice(-7).map(d => ({
    day: d.day,
    revenue: d.settlement.revenue,
    profit: d.settlement.netProfit,
    customers: d.settlement.customerCount,
    purchases: d.toolCalls.filter(tc => tc.name === "purchase_goods").length,
    promotions: d.toolCalls.filter(tc => tc.name === "run_promotion").length,
    toolCalls: d.toolCalls.length,
  }));

  const sat = m.customerSatisfactionTrend;
  const rep = m.reputationTrend ?? [];
  const totalDays = m.dailyProfitTrend.length;
  const profitableDays = m.dailyProfitTrend.filter(v => v >= 0).length;
  const lossDays = Math.max(0, totalDays - profitableDays);

  const bestProfit = m.dailyProfitTrend.length > 0 ? Math.max(...m.dailyProfitTrend) : 0;
  const worstProfit = m.dailyProfitTrend.length > 0 ? Math.min(...m.dailyProfitTrend) : 0;
  const bestDay = m.dailyProfitTrend.length > 0 ? m.dailyProfitTrend.indexOf(bestProfit) + 1 : 0;
  const worstDay = m.dailyProfitTrend.length > 0 ? m.dailyProfitTrend.indexOf(worstProfit) + 1 : 0;

  const satStart = sat[0];
  const satEnd = sat[sat.length - 1];
  const repStart = rep[0];
  const repEnd = rep[rep.length - 1];
  const satDelta = typeof satStart === "number" && typeof satEnd === "number" ? satEnd - satStart : Number.NaN;
  const repDelta = typeof repStart === "number" && typeof repEnd === "number" ? repEnd - repStart : Number.NaN;

  const dayLabel = (day: number) => (locale === "zh" ? `第${day}天` : `Day ${day}`);
  const bestDayText = bestDay > 0 ? `${dayLabel(bestDay)} · ${formatYen(bestProfit)}` : "–";
  const worstDayText = worstDay > 0 ? `${dayLabel(worstDay)} · ${formatYen(worstProfit)}` : "–";
  const summaryBody = locale === "zh"
    ? `30天总收入 ${formatYen(dm.totalRevenue)}，毛利率 ${formatPct(dm.grossMargin)}，工具调用 ${m.totalToolCalls} 次（错误率 ${formatPct(dm.errorRate)}）。`
    : `Across 30 days: revenue ${formatYen(dm.totalRevenue)}, gross margin ${formatPct(dm.grossMargin)}, and ${m.totalToolCalls} tool calls with ${formatPct(dm.errorRate)} error rate.`;
  const profileTag = m.netProfit >= 0 ? text.summaryPositive : text.summaryNegative;

  return (
    <div className="container">
      <div className="page-header">
        <h1>{getModelDisplayName(result.model)}</h1>
        <p>
          {text.scenario}: {result.scenario} &middot; {text.completed}: {result.completedAt.slice(0, 10)}
        </p>
      </div>

      <div className="card report-hero-panel">
        <div className="report-hero-main">
          <p className="report-hero-kicker">{text.summaryTitle}</p>
          <div className="report-hero-title-row">
            <h2 className="report-hero-value">{formatYen(m.netProfit)}</h2>
            <span className={`report-hero-tag ${m.netProfit >= 0 ? "positive" : "negative"}`}>
              {profileTag}
            </span>
          </div>
          <p className="report-hero-desc">{summaryBody}</p>
        </div>
        <div className="report-hero-facts">
          <div className="report-hero-fact">
            <span>{text.profitDays}</span>
            <strong>{profitableDays}/{totalDays}</strong>
          </div>
          <div className="report-hero-fact">
            <span>{text.lossDays}</span>
            <strong>{lossDays}/{totalDays}</strong>
          </div>
          <div className="report-hero-fact">
            <span>{text.bestDay}</span>
            <strong>{bestDayText}</strong>
          </div>
          <div className="report-hero-fact">
            <span>{text.worstDay}</span>
            <strong>{worstDayText}</strong>
          </div>
          <div className="report-hero-fact">
            <span>{text.toolErrorRate}</span>
            <strong>{formatPct(dm.errorRate)}</strong>
          </div>
        </div>
      </div>

      {/* Hero metrics */}
      <div className="grid-auto report-metric-grid" style={{ marginBottom: "2rem" }}>
        <MetricCard
          value={formatYen(m.netProfit)}
          label={text.score}
          color={m.netProfit >= 0 ? "#10b981" : "#ef4444"}
          note={`${text.avgDailyProfit}: ${formatYen(m.avgDailyProfit)}`}
          tone={m.netProfit >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          value={formatYen(m.finalCash)}
          label={text.finalCash}
          color="#f59e0b"
          note={`${text.outstandingLoans}: ${formatYen(m.outstandingLoans)}`}
          tone={m.finalCash >= inferredStartingCash ? "positive" : "negative"}
        />
        <MetricCard
          value={formatYen(dm.totalRevenue)}
          label={text.totalRevenue}
          color="#60a5fa"
          note={`${text.revenuePerCustomer}: ${formatYen(dm.revenuePerCustomer)}`}
          tone="accent"
        />
        <MetricCard
          value={formatPct(dm.grossMargin)}
          label={text.grossMargin}
          color="#a78bfa"
          note={`${text.inventoryWasteRate}: ${formatPct(m.inventoryWasteRate)}`}
          tone="accent"
        />
        <MetricCard
          value={String(m.totalToolCalls)}
          label={text.toolCalls}
          color="#84cc16"
          note={`${text.toolErrorRate}: ${formatPct(dm.errorRate)}`}
          tone="neutral"
        />
        <MetricCard
          value={`${sat[0]?.toFixed(0) ?? "–"} → ${sat[sat.length - 1]?.toFixed(0) ?? "–"}`}
          label={text.satisfaction}
          color="#06b6d4"
          note={`Δ ${formatDelta(satDelta)}`}
          tone={Number.isFinite(satDelta) ? (satDelta >= 0 ? "positive" : "negative") : "neutral"}
        />
        <MetricCard
          value={`${rep[0]?.toFixed(0) ?? "–"} → ${rep[rep.length - 1]?.toFixed(0) ?? "–"}`}
          label={text.reputation}
          color="#8b5cf6"
          note={`Δ ${formatDelta(repDelta)}`}
          tone={Number.isFinite(repDelta) ? (repDelta >= 0 ? "positive" : "negative") : "neutral"}
        />
      </div>

      <ReportCharts
        profitChartData={profitChartData}
        inventoryChartData={inventoryChartData}
        toolUsageData={toolUsageData}
        toolCallsPerDay={toolCallsPerDay}
        productSales={productSales}
        endGameDays={endGameDays}
        startingCash={Math.round(inferredStartingCash)}
        locale={locale}
      />

      <SectionHeader title={text.operationalMetrics} />
      <div className="card">
        <table>
          <tbody>
            <tr><td>{text.cashFlowBreakDays}</td><td>{m.cashFlowBreakDays}</td></tr>
            <tr><td>{text.inventoryWasteRate}</td><td>{formatPct(m.inventoryWasteRate)}</td></tr>
            <tr><td>{text.bankruptcyTriggered}</td><td>{m.bankruptcyTriggered ? text.yes : text.no}</td></tr>
            <tr><td>{text.outstandingLoans}</td><td>{formatYen(m.outstandingLoans)}</td></tr>
            <tr><td>{text.avgDailyProfit}</td><td>{formatYen(m.avgDailyProfit)}</td></tr>
            <tr><td>{text.totalHiresFires}</td><td>{dm.hires} / {dm.fires}</td></tr>
            <tr><td>{text.purchaseOrders}</td><td>{dm.ordersAttempted} ({dm.ordersFailed} {text.failed})</td></tr>
            <tr><td>{text.priceAdjustments}</td><td>{dm.setPriceCalls}</td></tr>
            <tr><td>{text.revenuePerCustomer}</td><td>{formatYen(dm.revenuePerCustomer)}</td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <a href={`/${locale}/replay/${result.id}`} className="action-link" style={{ fontSize: "1rem" }}>
          {text.replayLink} →
        </a>
      </div>
    </div>
  );
}
