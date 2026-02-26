"use client";

import { TrendLineChart } from "@/components/TrendLineChart";
import { HorizontalBarChart } from "@/components/HorizontalBarChart";
import { GroupedBarChart } from "@/components/GroupedBarChart";
import { SectionHeader } from "@/components/SectionHeader";
import { formatYen } from "@/lib/types";

interface ReportChartsProps {
  profitChartData: { day: number; profit: number; cumulative: number; revenue: number }[];
  inventoryChartData: { day: number; value: number }[];
  toolUsageData: { name: string; value: number; errors: number; color: string }[];
  toolCallsPerDay: { day: number; calls: number; errors: number }[];
  productSales: { product: string; revenue: number; expired: number }[];
  endGameDays: { day: number; revenue: number; profit: number; customers: number; purchases: number; promotions: number; toolCalls: number }[];
}

export function ReportCharts({
  profitChartData,
  inventoryChartData,
  toolUsageData,
  toolCallsPerDay,
  productSales,
  endGameDays,
}: ReportChartsProps) {
  return (
    <>
      <SectionHeader title="Financial Performance" />
      <div className="grid-2">
        <div className="card">
          <h3>Daily Revenue &amp; Cumulative Profit</h3>
          <TrendLineChart
            data={profitChartData}
            xKey="day"
            series={[
              { key: "revenue", name: "Daily Revenue", color: "#60a5fa" },
              { key: "cumulative", name: "Cumulative Profit", color: "#10b981", type: "area" },
            ]}
            height={300}
            showZeroLine
          />
        </div>
        <div className="card">
          <h3>Daily Profit</h3>
          <TrendLineChart
            data={profitChartData}
            xKey="day"
            series={[
              { key: "profit", name: "Daily Profit", color: "#f59e0b" },
            ]}
            height={300}
            showZeroLine
          />
        </div>
      </div>

      <SectionHeader title="Inventory" />
      <div className="grid-2">
        <div className="card">
          <h3>Inventory Value Trend</h3>
          <TrendLineChart
            data={inventoryChartData}
            xKey="day"
            series={[
              { key: "value", name: "Inventory Value", color: "#a78bfa", type: "area" },
            ]}
            height={250}
          />
        </div>
        <div className="card">
          <h3>Product Sales</h3>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Expired</th>
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

      <SectionHeader title="Tool Usage" />
      <div className="grid-2">
        <div className="card">
          <h3>By Tool Type</h3>
          <HorizontalBarChart data={toolUsageData} />
        </div>
        <div className="card">
          <h3>Calls Per Day</h3>
          <GroupedBarChart
            data={toolCallsPerDay}
            xKey="day"
            series={[
              { key: "calls", name: "Tool Calls", color: "#60a5fa" },
              { key: "errors", name: "Errors", color: "#ef4444" },
            ]}
            height={300}
          />
        </div>
      </div>

      <SectionHeader title="End-game Strategy" subtitle="Last 7 days" />
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th className="text-right">Revenue</th>
              <th className="text-right">Profit</th>
              <th className="text-right">Customers</th>
              <th className="text-right">Purchases</th>
              <th className="text-right">Promotions</th>
              <th className="text-right">Tool Calls</th>
            </tr>
          </thead>
          <tbody>
            {endGameDays.map(d => (
              <tr key={d.day}>
                <td>Day {d.day}</td>
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
