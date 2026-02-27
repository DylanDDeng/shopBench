"use client";

import { useState } from "react";
import { CompareTabPanel } from "@/components/CompareTabPanel";
import { RadarCompare } from "@/components/RadarCompare";
import { TrendLineChart } from "@/components/TrendLineChart";
import { GroupedBarChart } from "@/components/GroupedBarChart";
import { SectionHeader } from "@/components/SectionHeader";
import { formatYen, formatPct } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface Model {
  name: string;
  color: string;
}

interface CompareContentProps {
  locale?: Locale;
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
  locale = "en",
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
  const defaultModelA = models[0]?.name ?? "";
  const defaultModelB = models[1]?.name ?? models[0]?.name ?? "";

  const [radarMode, setRadarMode] = useState<"all" | "pair">("all");
  const [modelA, setModelA] = useState(defaultModelA);
  const [modelB, setModelB] = useState(defaultModelB);

  const handleModelAChange = (value: string) => {
    setModelA(value);
    if (value === modelB) {
      const alt = models.find(m => m.name !== value)?.name ?? value;
      setModelB(alt);
    }
  };

  const handleModelBChange = (value: string) => {
    setModelB(value);
    if (value === modelA) {
      const alt = models.find(m => m.name !== value)?.name ?? value;
      setModelA(alt);
    }
  };

  const selectedModels = models.filter(m => m.name === modelA || m.name === modelB);
  const selectedSeries = selectedModels.map(m => ({ key: m.name, name: m.name, color: m.color }));
  const selectedRadarData = radarData.map(row => ({
    metric: row.metric,
    [modelA]: row[modelA as keyof typeof row],
    [modelB]: row[modelB as keyof typeof row],
  }));
  const overviewSeries = radarMode === "pair" ? selectedSeries : series;
  const overviewRadarData = radarMode === "pair" ? selectedRadarData : radarData;
  const overviewSummaryRows = radarMode === "pair"
    ? summaryTable.filter(row => row.name === modelA || row.name === modelB)
    : summaryTable;
  const text = locale === "zh"
    ? {
        overview: "总览",
        financial: "财务",
        purchasing: "采购",
        inventory: "库存",
        tools: "工具使用",
        endgame: "收官阶段",
        multiComparison: "多维能力对比",
        allModels: "全部模型",
        pickTwoModels: "选择2个模型",
        modelA: "模型 A",
        modelB: "模型 B",
        scoreSummary: "核心指标汇总",
        model: "模型",
        score: "分数",
        cash: "现金",
        revenue: "收入",
        margin: "毛利率",
        satisfaction: "满意度",
        cumulativeProfit: "累计利润趋势",
        dailyCash: "每日现金余额",
        spendingByPhase: "分阶段支出",
        purchasingSummary: "采购汇总",
        orders: "总调用",
        failures: "失败次数",
        errorRate: "错误率",
        toolCalls: "工具调用",
        inventoryValue: "库存价值趋势",
        inventorySummary: "库存汇总",
        clearanceRate: "清仓率",
        endInventoryValue: "期末库存价值",
        toolCallsPerDay: "每日工具调用",
        toolUsageBreakdown: "工具类型分布",
        lastFiveDaysStrategy: "最后5天策略",
        endgameSummary: "收官汇总",
        purchasesLastFiveDays: "采购 (近5天)",
        promotionsLastFiveDays: "促销 (近5天)",
        endInventory: "期末库存",
        purchases: "采购",
        promotions: "促销",
      }
    : {
        overview: "Overview",
        financial: "Financial",
        purchasing: "Purchasing",
        inventory: "Inventory",
        tools: "Tool Usage",
        endgame: "End-game",
        multiComparison: "Multi-Dimensional Comparison",
        allModels: "All Models",
        pickTwoModels: "Pick 2 Models",
        modelA: "Model A",
        modelB: "Model B",
        scoreSummary: "Score Summary",
        model: "Model",
        score: "Score",
        cash: "Cash",
        revenue: "Revenue",
        margin: "Margin",
        satisfaction: "Satisfaction",
        cumulativeProfit: "Cumulative Profit Over Time",
        dailyCash: "Daily Cash Balance",
        spendingByPhase: "Spending by Phase",
        purchasingSummary: "Purchasing Summary",
        orders: "Orders",
        failures: "Failures",
        errorRate: "Error Rate",
        toolCalls: "Tool Calls",
        inventoryValue: "Inventory Value Over Time",
        inventorySummary: "Inventory Summary",
        clearanceRate: "Clearance Rate",
        endInventoryValue: "End Inventory Value",
        toolCallsPerDay: "Tool Calls Per Day",
        toolUsageBreakdown: "Tool Usage Breakdown",
        lastFiveDaysStrategy: "Last 5 Days Strategy",
        endgameSummary: "End-game Summary",
        purchasesLastFiveDays: "Purchases (Last 5d)",
        promotionsLastFiveDays: "Promotions (Last 5d)",
        endInventory: "End Inventory",
        purchases: "Purchases",
        promotions: "Promotions",
      };

  const tabs = [
    {
      id: "overview",
      label: text.overview,
      content: (
        <div>
          <div className="grid-2">
            <div className="card">
              <h3>{text.multiComparison}</h3>
              <div className="compare-radar-controls">
                <div className="compare-radar-mode">
                  <button
                    type="button"
                    className={`compare-mode-btn ${radarMode === "all" ? "active" : ""}`}
                    onClick={() => setRadarMode("all")}
                  >
                    {text.allModels}
                  </button>
                  <button
                    type="button"
                    className={`compare-mode-btn ${radarMode === "pair" ? "active" : ""}`}
                    onClick={() => setRadarMode("pair")}
                    disabled={models.length < 2}
                  >
                    {text.pickTwoModels}
                  </button>
                </div>
                {radarMode === "pair" && models.length > 1 && (
                  <div className="compare-model-picks">
                    <label className="compare-pick-label">
                      {text.modelA}
                      <select
                        className="compare-pick-select"
                        value={modelA}
                        onChange={e => handleModelAChange(e.target.value)}
                      >
                        {models.map(m => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="compare-pick-label">
                      {text.modelB}
                      <select
                        className="compare-pick-select"
                        value={modelB}
                        onChange={e => handleModelBChange(e.target.value)}
                      >
                        {models.map(m => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>
              <RadarCompare data={overviewRadarData} axisKey="metric" series={overviewSeries} />
            </div>
            <div className="card">
              <h3>{text.scoreSummary}</h3>
              <table>
                <thead>
                  <tr>
                    <th>{text.model}</th>
                    <th className="text-right">{text.score}</th>
                    <th className="text-right">{text.cash}</th>
                    <th className="text-right">{text.revenue}</th>
                    <th className="text-right">{text.margin}</th>
                    <th className="text-right">{text.satisfaction}</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewSummaryRows.map(row => (
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
      label: text.financial,
      content: (
        <div>
          <div className="card">
            <h3>{text.cumulativeProfit}</h3>
            <TrendLineChart
              data={cumulativeProfitData}
              xKey="day"
              series={series.map(s => ({ ...s, type: "area" as const }))}
              height={400}
              showZeroLine
            />
          </div>
          <div className="card">
            <h3>{text.dailyCash}</h3>
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
      label: text.purchasing,
      content: (
        <div>
          <div className="card">
            <h3>{text.spendingByPhase}</h3>
            <GroupedBarChart
              data={purchasingData}
              xKey="phase"
              series={series}
              height={350}
            />
          </div>
          <div className="card">
            <h3>{text.purchasingSummary}</h3>
            <table>
              <thead>
                <tr>
                  <th>{text.model}</th>
                  <th className="text-right">{text.orders}</th>
                  <th className="text-right">{text.failures}</th>
                  <th className="text-right">{text.errorRate}</th>
                  <th className="text-right">{text.toolCalls}</th>
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
      label: text.inventory,
      content: (
        <div>
          <div className="card">
            <h3>{text.inventoryValue}</h3>
            <TrendLineChart
              data={inventoryValueData}
              xKey="day"
              series={series}
              height={350}
            />
          </div>
          <div className="card">
            <h3>{text.inventorySummary}</h3>
            <table>
              <thead>
                <tr>
                  <th>{text.model}</th>
                  <th className="text-right">{text.clearanceRate}</th>
                  <th className="text-right">{text.endInventoryValue}</th>
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
      label: text.tools,
      content: (
        <div>
          <div className="card">
            <h3>{text.toolCallsPerDay}</h3>
            <TrendLineChart
              data={toolCallsPerDay}
              xKey="day"
              series={series}
              height={300}
            />
          </div>
          <div className="card">
            <h3>{text.toolUsageBreakdown}</h3>
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
      label: text.endgame,
      content: (
        <div>
          <div className="card">
            <h3>{text.lastFiveDaysStrategy}</h3>
            <GroupedBarChart
              data={endGameData}
              xKey="model"
              series={[
                { key: "purchases", name: text.purchases, color: "#60a5fa" },
                { key: "promotions", name: text.promotions, color: "#10b981" },
              ]}
              height={300}
            />
          </div>
          <div className="card">
            <h3>{text.endgameSummary}</h3>
            <table>
              <thead>
                <tr>
                  <th>{text.model}</th>
                  <th className="text-right">{text.purchasesLastFiveDays}</th>
                  <th className="text-right">{text.promotionsLastFiveDays}</th>
                  <th className="text-right">{text.clearanceRate}</th>
                  <th className="text-right">{text.endInventory}</th>
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
