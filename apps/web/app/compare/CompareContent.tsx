"use client";

import { CompareTabPanel } from "@/components/CompareTabPanel";
import { RadarCompare } from "@/components/RadarCompare";
import { TrendLineChart } from "@/components/TrendLineChart";
import { GroupedBarChart } from "@/components/GroupedBarChart";
import { SectionHeader } from "@/components/SectionHeader";
import { formatYen, formatPct } from "@/lib/types";

interface Model {
  name: string;
  color: string;
}

interface CompareContentProps {
  models: Model[];
  radarData: Record<string, unknown>[];
  summaryTable: {
    name: string;
    score: number;
    finalCash: number;
    revenue: number;
    grossMargin: number;
    toolCalls: number;
    errorRate: number;
    clearance: number;
    satisfaction: number;
  }[];
  cumulativeProfitData: Record<string, unknown>[];
  dailyCashData: Record<string, unknown>[];
  purchasingData: Record<string, unknown>[];
  inventoryValueData: Record<string, unknown>[];
  toolCallsPerDay: Record<string, unknown>[];
  toolBreakdownData: Record<string, unknown>[];
  endGameData: { model: string; purchases: number; promotions: number; clearanceRate: number; endInventory: number }[];
}

export function CompareContent({
  models,
  radarData,
  summaryTable,
  cumulativeProfitData,
  dailyCashData,
  purchasingData,
  inventoryValueData,
  toolCallsPerDay,
  toolBreakdownData,
  endGameData,
}: CompareContentProps) {
  const series = models.map(m => ({ key: m.name, name: m.name, color: m.color }));

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <div>
          <div className="grid-2">
            <div className="card">
              <h3>Multi-Dimensional Comparison</h3>
              <RadarCompare data={radarData} axisKey="metric" series={series} />
            </div>
            <div className="card">
              <h3>Score Summary</h3>
              <table>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th className="text-right">Score</th>
                    <th className="text-right">Cash</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-right">Margin</th>
                    <th className="text-right">Satisfaction</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryTable.map(row => (
                    <tr key={row.name}>
                      <td><strong>{row.name}</strong></td>
                      <td className={`text-right ${row.score >= 0 ? "profit-positive" : "profit-negative"}`}>
                        {formatYen(row.score)}
                      </td>
                      <td className="text-right">{formatYen(row.finalCash)}</td>
                      <td className="text-right">{formatYen(row.revenue)}</td>
                      <td className="text-right">{formatPct(row.grossMargin)}</td>
                      <td className="text-right">{row.satisfaction.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "financial",
      label: "Financial",
      content: (
        <div>
          <div className="card">
            <h3>Cumulative Profit Over Time</h3>
            <TrendLineChart
              data={cumulativeProfitData}
              xKey="day"
              series={series.map(s => ({ ...s, type: "area" as const }))}
              height={400}
              showZeroLine
            />
          </div>
          <div className="card">
            <h3>Daily Cash Balance</h3>
            <TrendLineChart
              data={dailyCashData}
              xKey="day"
              series={series}
              height={300}
            />
          </div>
        </div>
      ),
    },
    {
      id: "purchasing",
      label: "Purchasing",
      content: (
        <div>
          <div className="card">
            <h3>Spending by Phase</h3>
            <GroupedBarChart
              data={purchasingData}
              xKey="phase"
              series={series}
              height={350}
            />
          </div>
          <div className="card">
            <h3>Purchasing Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Model</th>
                  <th className="text-right">Orders</th>
                  <th className="text-right">Failures</th>
                  <th className="text-right">Error Rate</th>
                  <th className="text-right">Tool Calls</th>
                </tr>
              </thead>
              <tbody>
                {summaryTable.map(row => (
                  <tr key={row.name}>
                    <td><strong>{row.name}</strong></td>
                    <td className="text-right">{row.toolCalls}</td>
                    <td className="text-right">{Math.round(row.errorRate * row.toolCalls)}</td>
                    <td className="text-right">{formatPct(row.errorRate)}</td>
                    <td className="text-right">{row.toolCalls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: "inventory",
      label: "Inventory",
      content: (
        <div>
          <div className="card">
            <h3>Inventory Value Over Time</h3>
            <TrendLineChart
              data={inventoryValueData}
              xKey="day"
              series={series}
              height={350}
            />
          </div>
          <div className="card">
            <h3>Inventory Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Model</th>
                  <th className="text-right">Clearance Rate</th>
                  <th className="text-right">End Inventory Value</th>
                </tr>
              </thead>
              <tbody>
                {summaryTable.map(row => (
                  <tr key={row.name}>
                    <td><strong>{row.name}</strong></td>
                    <td className="text-right">{formatPct(row.clearance)}</td>
                    <td className="text-right">{formatYen(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: "tools",
      label: "Tool Usage",
      content: (
        <div>
          <div className="card">
            <h3>Tool Calls Per Day</h3>
            <TrendLineChart
              data={toolCallsPerDay}
              xKey="day"
              series={series}
              height={300}
            />
          </div>
          <div className="card">
            <h3>Tool Usage Breakdown</h3>
            <GroupedBarChart
              data={toolBreakdownData}
              xKey="tool"
              series={series}
              height={Math.max(300, toolBreakdownData.length * 40)}
              layout="horizontal"
            />
          </div>
        </div>
      ),
    },
    {
      id: "endgame",
      label: "End-game",
      content: (
        <div>
          <div className="card">
            <h3>Last 5 Days Strategy</h3>
            <GroupedBarChart
              data={endGameData}
              xKey="model"
              series={[
                { key: "purchases", name: "Purchases", color: "#60a5fa" },
                { key: "promotions", name: "Promotions", color: "#10b981" },
              ]}
              height={300}
            />
          </div>
          <div className="card">
            <h3>End-game Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Model</th>
                  <th className="text-right">Purchases (Last 5d)</th>
                  <th className="text-right">Promotions (Last 5d)</th>
                  <th className="text-right">Clearance Rate</th>
                  <th className="text-right">End Inventory</th>
                </tr>
              </thead>
              <tbody>
                {endGameData.map(row => (
                  <tr key={row.model}>
                    <td><strong>{row.model}</strong></td>
                    <td className="text-right">{row.purchases}</td>
                    <td className="text-right">{row.promotions}</td>
                    <td className="text-right">{row.clearanceRate}%</td>
                    <td className="text-right">{formatYen(row.endInventory)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
  ];

  return <CompareTabPanel tabs={tabs} defaultTab="overview" />;
}
