"use client";

import { TrendLineChart } from "@/components/TrendLineChart";
import { HorizontalBarChart } from "@/components/HorizontalBarChart";
import { GroupedBarChart } from "@/components/GroupedBarChart";
import { SectionHeader } from "@/components/SectionHeader";
import { formatYen } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface ReportChartsProps {
  profitChartData: { day: number; profit: number; cumulative: number; revenue: number; netCash: number }[];
  inventoryChartData: { day: number; value: number }[];
  toolUsageData: { name: string; value: number; errors: number; color: string }[];
  toolCallsPerDay: { day: number; calls: number; errors: number }[];
  productSales: { product: string; revenue: number; expired: number }[];
  endGameDays: { day: number; revenue: number; profit: number; customers: number; purchases: number; promotions: number; toolCalls: number }[];
  startingCash: number;
  locale?: Locale;
}

const REPORT_CHART_TEXT: Record<Locale, {
  financialPerformance: string;
  financialSubtitle: string;
  dailyRevenueAndCumulativeProfit: string;
  dailyRevenueAndCumulativeProfitSubtitle: string;
  dailyRevenue: string;
  cumulativeProfit: string;
  dailyProfit: string;
  dailyProfitSubtitle: string;
  netCashTrajectory: string;
  netCashTrajectorySubtitle: string;
  netCash: string;
  peakRevenue: string;
  bestDay: string;
  worstDay: string;
  profitDays: string;
  lossDays: string;
  avgProfit: string;
  openingCash: string;
  lowestCash: string;
  maxDrawdown: string;
  inventory: string;
  inventorySubtitle: string;
  inventoryValueTrend: string;
  inventoryValue: string;
  endingInventory: string;
  peakInventory: string;
  productSales: string;
  product: string;
  revenue: string;
  expired: string;
  toolUsage: string;
  toolUsageSubtitle: string;
  byToolType: string;
  callsPerDay: string;
  toolCalls: string;
  errors: string;
  totalCalls: string;
  totalErrors: string;
  errorRate: string;
  peakCallsDay: string;
  peakErrorsDay: string;
  endGameStrategy: string;
  endGameSubtitle: string;
  last7Days: string;
  day: string;
  profit: string;
  customers: string;
  purchases: string;
  promotions: string;
}> = {
  en: {
    financialPerformance: "Financial Performance",
    financialSubtitle: "Revenue quality, profit volatility and cash carry-through",
    dailyRevenueAndCumulativeProfit: "Daily Revenue & Cumulative Profit",
    dailyRevenueAndCumulativeProfitSubtitle: "Topline speed vs retained earnings over time",
    dailyRevenue: "Daily Revenue",
    cumulativeProfit: "Cumulative Profit",
    dailyProfit: "Daily Profit",
    dailyProfitSubtitle: "Net result per day (non-cumulative)",
    netCashTrajectory: "Net Cash Trajectory",
    netCashTrajectorySubtitle: "Daily end-of-day cash balance",
    netCash: "Net Cash",
    peakRevenue: "Peak Revenue",
    bestDay: "Best Day",
    worstDay: "Worst Day",
    profitDays: "Profit Days",
    lossDays: "Loss Days",
    avgProfit: "Avg Profit",
    openingCash: "Opening Cash",
    lowestCash: "Lowest Cash",
    maxDrawdown: "Max Drawdown",
    inventory: "Inventory",
    inventorySubtitle: "Stock carrying and sell-through quality",
    inventoryValueTrend: "Inventory Value Trend",
    inventoryValue: "Inventory Value",
    endingInventory: "Ending Inventory",
    peakInventory: "Peak Inventory",
    productSales: "Product Sales",
    product: "Product",
    revenue: "Revenue",
    expired: "Expired",
    toolUsage: "Tool Usage",
    toolUsageSubtitle: "Execution profile and reliability by tool",
    byToolType: "By Tool Type",
    callsPerDay: "Calls Per Day",
    toolCalls: "Tool Calls",
    errors: "Errors",
    totalCalls: "Total Calls",
    totalErrors: "Total Errors",
    errorRate: "Error Rate",
    peakCallsDay: "Peak Calls Day",
    peakErrorsDay: "Peak Errors Day",
    endGameStrategy: "End-game Strategy",
    endGameSubtitle: "Final-week execution intensity",
    last7Days: "Last 7 days",
    day: "Day",
    profit: "Profit",
    customers: "Customers",
    purchases: "Purchases",
    promotions: "Promotions",
  },
  zh: {
    financialPerformance: "财务表现",
    financialSubtitle: "收入质量、利润波动与现金承接",
    dailyRevenueAndCumulativeProfit: "每日收入与累计利润",
    dailyRevenueAndCumulativeProfitSubtitle: "看收入冲刺与利润沉淀是否同步",
    dailyRevenue: "每日收入",
    cumulativeProfit: "累计利润",
    dailyProfit: "每日利润",
    dailyProfitSubtitle: "单日净利润（非累计）",
    netCashTrajectory: "净现金轨迹",
    netCashTrajectorySubtitle: "每日收盘现金余额",
    netCash: "净现金",
    peakRevenue: "收入峰值",
    bestDay: "最佳单日",
    worstDay: "最差单日",
    profitDays: "盈利天数",
    lossDays: "亏损天数",
    avgProfit: "日均利润",
    openingCash: "起始现金",
    lowestCash: "最低现金",
    maxDrawdown: "最大回撤",
    inventory: "库存",
    inventorySubtitle: "库存占用与去化质量",
    inventoryValueTrend: "库存价值趋势",
    inventoryValue: "库存价值",
    endingInventory: "期末库存",
    peakInventory: "库存峰值",
    productSales: "商品销售",
    product: "商品",
    revenue: "收入",
    expired: "过期数量",
    toolUsage: "工具使用",
    toolUsageSubtitle: "执行结构与工具稳定性",
    byToolType: "按工具类型",
    callsPerDay: "每日调用次数",
    toolCalls: "工具调用",
    errors: "错误数",
    totalCalls: "总调用",
    totalErrors: "总错误",
    errorRate: "错误率",
    peakCallsDay: "调用峰值日",
    peakErrorsDay: "错误峰值日",
    endGameStrategy: "后程策略",
    endGameSubtitle: "最后一周执行明细",
    last7Days: "最近 7 天",
    day: "第",
    profit: "利润",
    customers: "顾客数",
    purchases: "采购次数",
    promotions: "促销次数",
  },
};

function formatCompactYen(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10000) return `¥${Math.round(value / 1000)}k`;
  return `¥${Math.round(value)}`;
}

function formatRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

export function ReportCharts({
  profitChartData,
  inventoryChartData,
  toolUsageData,
  toolCallsPerDay,
  productSales,
  endGameDays,
  startingCash,
  locale = "en",
}: ReportChartsProps) {
  const text = REPORT_CHART_TEXT[locale];
  const dayLabel = (day: number) => (day > 0 ? (locale === "zh" ? `第${day}天` : `Day ${day}`) : "–");

  const revenueSeries = profitChartData.map(d => d.revenue);
  const profitSeries = profitChartData.map(d => d.profit);
  const cashSeries = profitChartData.map(d => d.netCash);
  const inventorySeries = inventoryChartData.map(d => d.value);

  const peakRevenue = revenueSeries.length > 0 ? Math.max(...revenueSeries) : 0;
  const peakRevenueDay = revenueSeries.length > 0 ? revenueSeries.indexOf(peakRevenue) + 1 : 0;
  const bestProfit = profitSeries.length > 0 ? Math.max(...profitSeries) : 0;
  const bestProfitDay = profitSeries.length > 0 ? profitSeries.indexOf(bestProfit) + 1 : 0;
  const worstProfit = profitSeries.length > 0 ? Math.min(...profitSeries) : 0;
  const worstProfitDay = profitSeries.length > 0 ? profitSeries.indexOf(worstProfit) + 1 : 0;
  const positiveDays = profitSeries.filter(v => v >= 0).length;
  const lossDays = Math.max(0, profitSeries.length - positiveDays);
  const avgProfit = profitSeries.length > 0
    ? profitSeries.reduce((sum, v) => sum + v, 0) / profitSeries.length
    : 0;

  const lowestCash = cashSeries.length > 0 ? Math.min(...cashSeries) : 0;
  const peakCash = cashSeries.length > 0 ? Math.max(...cashSeries) : startingCash;
  const maxDrawdown = peakCash - lowestCash;

  const endInventory = inventorySeries.length > 0 ? inventorySeries[inventorySeries.length - 1] : 0;
  const peakInventory = inventorySeries.length > 0 ? Math.max(...inventorySeries) : 0;

  const totalCalls = toolCallsPerDay.reduce((sum, day) => sum + day.calls, 0);
  const totalErrors = toolCallsPerDay.reduce((sum, day) => sum + day.errors, 0);
  const errorRate = totalCalls > 0 ? totalErrors / totalCalls : 0;

  const maxCalls = toolCallsPerDay.length > 0 ? Math.max(...toolCallsPerDay.map(d => d.calls)) : 0;
  const maxCallsDay = toolCallsPerDay.length > 0 ? toolCallsPerDay.find(d => d.calls === maxCalls)?.day ?? 0 : 0;
  const maxErrors = toolCallsPerDay.length > 0 ? Math.max(...toolCallsPerDay.map(d => d.errors)) : 0;
  const maxErrorsDay = toolCallsPerDay.length > 0 ? toolCallsPerDay.find(d => d.errors === maxErrors)?.day ?? 0 : 0;

  return (
    <>
      <SectionHeader title={text.financialPerformance} subtitle={text.financialSubtitle} />
      <div className="grid-2 report-chart-grid">
        <div className="card report-chart-card">
          <div className="report-chart-head">
            <h3>{text.dailyRevenueAndCumulativeProfit}</h3>
            <p>{text.dailyRevenueAndCumulativeProfitSubtitle}</p>
          </div>
          <div className="report-chart-stats">
            <div className="report-chart-stat">
              <span>{text.peakRevenue}</span>
              <strong>{dayLabel(peakRevenueDay)} · {formatYen(peakRevenue)}</strong>
            </div>
            <div className="report-chart-stat">
              <span>{text.bestDay}</span>
              <strong>{dayLabel(bestProfitDay)} · {formatYen(bestProfit)}</strong>
            </div>
            <div className="report-chart-stat">
              <span>{text.worstDay}</span>
              <strong>{dayLabel(worstProfitDay)} · {formatYen(worstProfit)}</strong>
            </div>
          </div>
          <TrendLineChart
            data={profitChartData}
            xKey="day"
            series={[
              { key: "revenue", name: text.dailyRevenue, color: "#60a5fa" },
              { key: "cumulative", name: text.cumulativeProfit, color: "#10b981", type: "area" },
            ]}
            height={300}
            showZeroLine
            showLegend={false}
            yTickFormatter={formatCompactYen}
          />
          <div className="report-inline-legend">
            <span><i style={{ background: "#60a5fa" }} />{text.dailyRevenue}</span>
            <span><i style={{ background: "#10b981" }} />{text.cumulativeProfit}</span>
          </div>
        </div>
        <div className="card report-chart-card">
          <div className="report-chart-head">
            <h3>{text.dailyProfit}</h3>
            <p>{text.dailyProfitSubtitle}</p>
          </div>
          <div className="report-chart-stats">
            <div className="report-chart-stat">
              <span>{text.profitDays}</span>
              <strong>{positiveDays} / {profitSeries.length}</strong>
            </div>
            <div className="report-chart-stat">
              <span>{text.lossDays}</span>
              <strong>{lossDays} / {profitSeries.length}</strong>
            </div>
            <div className="report-chart-stat">
              <span>{text.avgProfit}</span>
              <strong>{formatYen(avgProfit)}</strong>
            </div>
          </div>
          <TrendLineChart
            data={profitChartData}
            xKey="day"
            series={[
              { key: "profit", name: text.dailyProfit, color: "#f59e0b" },
            ]}
            height={300}
            showZeroLine
            showLegend={false}
            yTickFormatter={formatCompactYen}
          />
          <div className="report-inline-legend">
            <span><i style={{ background: "#f59e0b" }} />{text.dailyProfit}</span>
          </div>
        </div>
      </div>

      <div className="card report-chart-card report-chart-card-full">
        <div className="report-chart-head">
          <h3>{text.netCashTrajectory}</h3>
          <p>{text.netCashTrajectorySubtitle}</p>
        </div>
        <div className="report-chart-stats">
          <div className="report-chart-stat">
            <span>{text.openingCash}</span>
            <strong>{formatYen(startingCash)}</strong>
          </div>
          <div className="report-chart-stat">
            <span>{text.lowestCash}</span>
            <strong>{formatYen(lowestCash)}</strong>
          </div>
          <div className="report-chart-stat">
            <span>{text.maxDrawdown}</span>
            <strong>{formatYen(maxDrawdown)}</strong>
          </div>
        </div>
        <TrendLineChart
          data={profitChartData}
          xKey="day"
          series={[
            { key: "netCash", name: text.netCash, color: "#0ea5e9", type: "area" },
          ]}
          height={270}
          showLegend={false}
          yTickFormatter={formatCompactYen}
        />
        <div className="report-inline-legend">
          <span><i style={{ background: "#0ea5e9" }} />{text.netCash}</span>
        </div>
      </div>

      <SectionHeader title={text.inventory} subtitle={text.inventorySubtitle} />
      <div className="grid-2 report-chart-grid">
        <div className="card report-chart-card">
          <div className="report-chart-head">
            <h3>{text.inventoryValueTrend}</h3>
          </div>
          <div className="report-chart-stats">
            <div className="report-chart-stat">
              <span>{text.endingInventory}</span>
              <strong>{formatYen(endInventory)}</strong>
            </div>
            <div className="report-chart-stat">
              <span>{text.peakInventory}</span>
              <strong>{formatYen(peakInventory)}</strong>
            </div>
          </div>
          <TrendLineChart
            data={inventoryChartData}
            xKey="day"
            series={[
              { key: "value", name: text.inventoryValue, color: "#a78bfa", type: "area" },
            ]}
            height={250}
            showLegend={false}
            yTickFormatter={formatCompactYen}
          />
          <div className="report-inline-legend">
            <span><i style={{ background: "#a78bfa" }} />{text.inventoryValue}</span>
          </div>
        </div>
        <div className="card report-chart-card">
          <div className="report-chart-head">
            <h3>{text.productSales}</h3>
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }} className="report-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{text.product}</th>
                  <th className="text-right">{text.revenue}</th>
                  <th className="text-right">{text.expired}</th>
                </tr>
              </thead>
              <tbody>
                {productSales.map(p => (
                  <tr key={p.product}>
                    <td>{p.product}</td>
                    <td className="text-right">{formatYen(p.revenue)}</td>
                    <td className="text-right" style={{ color: p.expired > 0 ? "var(--accent-red)" : "var(--text-muted)" }}>
                      {p.expired}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SectionHeader title={text.toolUsage} subtitle={text.toolUsageSubtitle} />
      <div className="grid-2 report-chart-grid">
        <div className="card report-chart-card">
          <div className="report-chart-head">
            <h3>{text.byToolType}</h3>
          </div>
          <div className="report-chart-stats">
            <div className="report-chart-stat">
              <span>{text.totalCalls}</span>
              <strong>{totalCalls}</strong>
            </div>
            <div className="report-chart-stat">
              <span>{text.totalErrors}</span>
              <strong>{totalErrors}</strong>
            </div>
            <div className="report-chart-stat">
              <span>{text.errorRate}</span>
              <strong>{formatRatio(errorRate)}</strong>
            </div>
          </div>
          <HorizontalBarChart data={toolUsageData} />
        </div>
        <div className="card report-chart-card">
          <div className="report-chart-head">
            <h3>{text.callsPerDay}</h3>
          </div>
          <div className="report-chart-stats">
            <div className="report-chart-stat">
              <span>{text.peakCallsDay}</span>
              <strong>{dayLabel(maxCallsDay)} · {maxCalls}</strong>
            </div>
            <div className="report-chart-stat">
              <span>{text.peakErrorsDay}</span>
              <strong>{dayLabel(maxErrorsDay)} · {maxErrors}</strong>
            </div>
          </div>
          <GroupedBarChart
            data={toolCallsPerDay}
            xKey="day"
            series={[
              { key: "calls", name: text.toolCalls, color: "#60a5fa" },
              { key: "errors", name: text.errors, color: "#ef4444" },
            ]}
            height={300}
          />
        </div>
      </div>

      <SectionHeader title={text.endGameStrategy} subtitle={`${text.endGameSubtitle} · ${text.last7Days}`} />
      <div className="card report-chart-card">
        <table>
          <thead>
            <tr>
              <th>{text.day}</th>
              <th className="text-right">{text.revenue}</th>
              <th className="text-right">{text.profit}</th>
              <th className="text-right">{text.customers}</th>
              <th className="text-right">{text.purchases}</th>
              <th className="text-right">{text.promotions}</th>
              <th className="text-right">{text.toolCalls}</th>
            </tr>
          </thead>
          <tbody>
            {endGameDays.map(d => (
              <tr key={d.day}>
                <td>{locale === "zh" ? `第${d.day}天` : `Day ${d.day}`}</td>
                <td className="text-right">{formatYen(d.revenue)}</td>
                <td className={`text-right ${d.profit >= 0 ? "profit-positive" : "profit-negative"}`}>
                  {formatYen(d.profit)}
                </td>
                <td className="text-right">{d.customers}</td>
                <td className="text-right">{d.purchases}</td>
                <td className="text-right">{d.promotions}</td>
                <td className="text-right">{d.toolCalls}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
