import { getResult, computeDerivedMetrics, getModelDisplayName, formatYen, formatPct, getToolLabel, getToolCategory } from "@/lib/data";
import { TOOL_CATEGORY_COLORS } from "@/lib/chartConfig";
import { MetricCard } from "@/components/MetricCard";
import { SectionHeader } from "@/components/SectionHeader";
import { ReportCharts } from "./ReportCharts";
import { notFound } from "next/navigation";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = getResult(id);
  if (!result) notFound();

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
          Scenario: {result.scenario} &middot; Completed: {result.completedAt.slice(0, 10)}
        </p>
      </div>

      {/* Hero metrics */}
      <div className="grid-6" style={{ marginBottom: "2rem" }}>
        <MetricCard
          value={formatYen(m.netProfit)}
          label="Score"
          color={m.netProfit >= 0 ? "#10b981" : "#ef4444"}
        />
        <MetricCard
          value={formatYen(m.finalCash)}
          label="Final Cash"
          color="#f59e0b"
        />
        <MetricCard
          value={formatYen(dm.totalRevenue)}
          label="Total Revenue"
          color="#60a5fa"
        />
        <MetricCard
          value={formatPct(dm.grossMargin)}
          label="Gross Margin"
          color="#a78bfa"
        />
        <MetricCard
          value={String(m.totalToolCalls)}
          label="Tool Calls"
          color="#84cc16"
        />
        <MetricCard
          value={`${sat[0]?.toFixed(0) ?? "–"} → ${sat[sat.length - 1]?.toFixed(0) ?? "–"}`}
          label="Satisfaction"
          color="#06b6d4"
        />
        <MetricCard
          value={`${rep[0]?.toFixed(0) ?? "–"} → ${rep[rep.length - 1]?.toFixed(0) ?? "–"}`}
          label="Reputation"
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
      />

      <SectionHeader title="Operational Metrics" />
      <div className="card">
        <table>
          <tbody>
            <tr><td>Cash Flow Break Days</td><td>{m.cashFlowBreakDays}</td></tr>
            <tr><td>Inventory Waste Rate</td><td>{formatPct(m.inventoryWasteRate)}</td></tr>
            <tr><td>Bankruptcy Triggered</td><td>{m.bankruptcyTriggered ? "Yes" : "No"}</td></tr>
            <tr><td>Outstanding Loans</td><td>{formatYen(m.outstandingLoans)}</td></tr>
            <tr><td>Avg Daily Profit</td><td>{formatYen(m.avgDailyProfit)}</td></tr>
            <tr><td>Total Hires / Fires</td><td>{dm.hires} / {dm.fires}</td></tr>
            <tr><td>Purchase Orders</td><td>{dm.ordersAttempted} ({dm.ordersFailed} failed)</td></tr>
            <tr><td>Price Adjustments</td><td>{dm.setPriceCalls}</td></tr>
            <tr><td>Revenue per Customer</td><td>{formatYen(dm.revenuePerCustomer)}</td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <a href={`/replay/${result.id}`} className="action-link" style={{ fontSize: "1rem" }}>
          View Day-by-Day Replay →
        </a>
      </div>
    </div>
  );
}
