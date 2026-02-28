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
  },
};

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
  let cumulative = 0;
  const profitChartData = m.dailyProfitTrend.map((profit, i) => {
    cumulative += profit;
    return {
      day: i + 1,
      profit: Math.round(profit),
      cumulative: Math.round(cumulative),
      revenue: Math.round(dm.dailyRevenue[i] ?? 0),
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

  return (
    <div className="container">
      <div className="page-header">
        <h1>{getModelDisplayName(result.model)}</h1>
        <p>
          {text.scenario}: {result.scenario} &middot; {text.completed}: {result.completedAt.slice(0, 10)}
        </p>
      </div>

      {/* Hero metrics */}
      <div className="grid-6" style={{ marginBottom: "2rem" }}>
        <MetricCard
          value={formatYen(m.netProfit)}
          label={text.score}
          color={m.netProfit >= 0 ? "#10b981" : "#ef4444"}
        />
        <MetricCard
          value={formatYen(m.finalCash)}
          label={text.finalCash}
          color="#f59e0b"
        />
        <MetricCard
          value={formatYen(dm.totalRevenue)}
          label={text.totalRevenue}
          color="#60a5fa"
        />
        <MetricCard
          value={formatPct(dm.grossMargin)}
          label={text.grossMargin}
          color="#a78bfa"
        />
        <MetricCard
          value={String(m.totalToolCalls)}
          label={text.toolCalls}
          color="#84cc16"
        />
        <MetricCard
          value={`${sat[0]?.toFixed(0) ?? "–"} → ${sat[sat.length - 1]?.toFixed(0) ?? "–"}`}
          label={text.satisfaction}
          color="#06b6d4"
        />
        <MetricCard
          value={`${rep[0]?.toFixed(0) ?? "–"} → ${rep[rep.length - 1]?.toFixed(0) ?? "–"}`}
          label={text.reputation}
          color="#8b5cf6"
        />
      </div>

      <ReportCharts
        profitChartData={profitChartData}
        inventoryChartData={inventoryChartData}
        toolUsageData={toolUsageData}
        toolCallsPerDay={toolCallsPerDay}
        productSales={productSales}
        endGameDays={endGameDays}
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
