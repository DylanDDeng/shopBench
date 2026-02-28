"use client";

import { TrendLineChart } from "@/components/TrendLineChart";
import { HorizontalBarChart } from "@/components/HorizontalBarChart";
import { GroupedBarChart } from "@/components/GroupedBarChart";
import { SectionHeader } from "@/components/SectionHeader";
import { formatYen } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface ReportChartsProps {
  profitChartData: { day: number; profit: number; cumulative: number; revenue: number }[];
  inventoryChartData: { day: number; value: number }[];
  toolUsageData: { name: string; value: number; errors: number; color: string }[];
  toolCallsPerDay: { day: number; calls: number; errors: number }[];
  productSales: { product: string; revenue: number; expired: number }[];
  endGameDays: { day: number; revenue: number; profit: number; customers: number; purchases: number; promotions: number; toolCalls: number }[];
  locale?: Locale;
}

const REPORT_CHART_TEXT: Record<Locale, {
  financialPerformance: string;
  dailyRevenueAndCumulativeProfit: string;
  dailyRevenue: string;
  cumulativeProfit: string;
  dailyProfit: string;
  inventory: string;
  inventoryValueTrend: string;
  inventoryValue: string;
  productSales: string;
  product: string;
  revenue: string;
  expired: string;
  toolUsage: string;
  byToolType: string;
  callsPerDay: string;
  toolCalls: string;
  errors: string;
  endGameStrategy: string;
  last7Days: string;
  day: string;
  profit: string;
  customers: string;
  purchases: string;
  promotions: string;
}> = {
  en: {
    financialPerformance: "Financial Performance",
    dailyRevenueAndCumulativeProfit: "Daily Revenue & Cumulative Profit",
    dailyRevenue: "Daily Revenue",
    cumulativeProfit: "Cumulative Profit",
    dailyProfit: "Daily Profit",
    inventory: "Inventory",
    inventoryValueTrend: "Inventory Value Trend",
    inventoryValue: "Inventory Value",
    productSales: "Product Sales",
    product: "Product",
    revenue: "Revenue",
    expired: "Expired",
    toolUsage: "Tool Usage",
    byToolType: "By Tool Type",
    callsPerDay: "Calls Per Day",
    toolCalls: "Tool Calls",
    errors: "Errors",
    endGameStrategy: "End-game Strategy",
    last7Days: "Last 7 days",
    day: "Day",
    profit: "Profit",
    customers: "Customers",
    purchases: "Purchases",
    promotions: "Promotions",
  },
  zh: {
    financialPerformance: "财务表现",
    dailyRevenueAndCumulativeProfit: "每日收入与累计利润",
    dailyRevenue: "每日收入",
    cumulativeProfit: "累计利润",
    dailyProfit: "每日利润",
    inventory: "库存",
    inventoryValueTrend: "库存价值趋势",
    inventoryValue: "库存价值",
    productSales: "商品销售",
    product: "商品",
    revenue: "收入",
    expired: "过期数量",
    toolUsage: "工具使用",
    byToolType: "按工具类型",
    callsPerDay: "每日调用次数",
    toolCalls: "工具调用",
    errors: "错误数",
    endGameStrategy: "后程策略",
    last7Days: "最近 7 天",
    day: "第",
    profit: "利润",
    customers: "顾客数",
    purchases: "采购次数",
    promotions: "促销次数",
  },
};

export function ReportCharts({
  profitChartData,
  inventoryChartData,
  toolUsageData,
  toolCallsPerDay,
  productSales,
  endGameDays,
  locale = "en",
}: ReportChartsProps) {
  const text = REPORT_CHART_TEXT[locale];

  return (
    <>
      <SectionHeader title={text.financialPerformance} />
      <div className="grid-2">
        <div className="card">
          <h3>{text.dailyRevenueAndCumulativeProfit}</h3>
          <TrendLineChart
            data={profitChartData}
            xKey="day"
            series={[
              { key: "revenue", name: text.dailyRevenue, color: "#60a5fa" },
              { key: "cumulative", name: text.cumulativeProfit, color: "#10b981", type: "area" },
            ]}
            height={300}
            showZeroLine
          />
        </div>
        <div className="card">
          <h3>{text.dailyProfit}</h3>
          <TrendLineChart
            data={profitChartData}
            xKey="day"
            series={[
              { key: "profit", name: text.dailyProfit, color: "#f59e0b" },
            ]}
            height={300}
            showZeroLine
          />
        </div>
      </div>

      <SectionHeader title={text.inventory} />
      <div className="grid-2">
        <div className="card">
          <h3>{text.inventoryValueTrend}</h3>
          <TrendLineChart
            data={inventoryChartData}
            xKey="day"
            series={[
              { key: "value", name: text.inventoryValue, color: "#a78bfa", type: "area" },
            ]}
            height={250}
          />
        </div>
        <div className="card">
          <h3>{text.productSales}</h3>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
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

      <SectionHeader title={text.toolUsage} />
      <div className="grid-2">
        <div className="card">
          <h3>{text.byToolType}</h3>
          <HorizontalBarChart data={toolUsageData} />
        </div>
        <div className="card">
          <h3>{text.callsPerDay}</h3>
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

      <SectionHeader title={text.endGameStrategy} subtitle={text.last7Days} />
      <div className="card">
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
