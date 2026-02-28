"use client";

import { useMemo, useState } from "react";
import { GroupedBarChart } from "@/components/GroupedBarChart";
import { RadarCompare } from "@/components/RadarCompare";
import { TrendLineChart } from "@/components/TrendLineChart";
import { formatPct, formatYen } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface DeepDiveSnapshot {
  netCash: number;
  totalRevenue: number;
  grossMargin: number;
  toolErrorRate: number;
  toolCalls: number;
  zeroRevenueDays: number;
  profitableDays: number;
}

interface DeepDiveComparison {
  relationLabel: string;
  referenceName: string;
  netCashDiff: number;
  revenueDiff: number;
  marginDiff: number;
  errorRateDiff: number;
}

interface DeepDiveCharts {
  trendData: Record<string, string | number>[];
  inventoryData: Record<string, string | number>[];
  grossProfitData: Record<string, string | number>[];
  netProfitData: Record<string, string | number>[];
  radarData: Record<string, string | number>[];
  toolMixData: Record<string, string | number>[];
}

interface DeepDiveChapter {
  title: string;
  dayRange: string;
  thesis: string;
  bullets: string[];
  evidence: string;
}

export interface DeepDiveReport {
  modelId: string;
  displayName: string;
  rank: number;
  strategyTitle: string;
  executiveSummary: string;
  operatingStyle: string;
  actionHighlights: string[];
  strengths: string[];
  weaknesses: string[];
  successReasons: string[];
  failureReasons: string[];
  comparisonNarrative: string;
  snapshot: DeepDiveSnapshot;
  comparison: DeepDiveComparison;
  charts: DeepDiveCharts;
  chapters: DeepDiveChapter[];
  chartKeys: {
    model: string;
    reference: string;
  };
  colors: {
    model: string;
    reference: string;
  };
}

interface DeepDiveReportsProps {
  reports: DeepDiveReport[];
  locale?: Locale;
}

type EvidenceTab = "trajectory" | "inventory" | "grossprofit" | "netprofit" | "radar" | "toolmix";

export function DeepDiveReports({ reports, locale = "en" }: DeepDiveReportsProps) {
  const isZh = locale === "zh";
  const [selectedModel, setSelectedModel] = useState(reports[0]?.modelId ?? "");
  const [evidenceTab, setEvidenceTab] = useState<EvidenceTab>("trajectory");

  const report = useMemo(
    () => reports.find(r => r.modelId === selectedModel) ?? reports[0],
    [reports, selectedModel],
  );

  if (!report) {
    return null;
  }

  const deltaRows = [
    {
      label: isZh ? "净现金差距" : "Net Cash Gap",
      value: report.comparison.netCashDiff,
      display: formatYen(report.comparison.netCashDiff),
      betterWhenLower: false,
    },
    {
      label: isZh ? "收入差距" : "Revenue Gap",
      value: report.comparison.revenueDiff,
      display: formatYen(report.comparison.revenueDiff),
      betterWhenLower: false,
    },
    {
      label: isZh ? "毛利率差距" : "Gross Margin Gap",
      value: report.comparison.marginDiff,
      display: `${(report.comparison.marginDiff * 100).toFixed(1)}${isZh ? " 点" : " pts"}`,
      betterWhenLower: false,
    },
    {
      label: isZh ? "错误率差距" : "Error Rate Gap",
      value: report.comparison.errorRateDiff,
      display: `${(report.comparison.errorRateDiff * 100).toFixed(1)}${isZh ? " 点" : " pts"}`,
      betterWhenLower: true,
    },
  ];
  const maxAbsDelta = Math.max(0.001, ...deltaRows.map(row => Math.abs(row.value)));

  return (
    <div className="deep-dive-shell">
      <div className="card deep-dive-toolbar">
        <div>
          <div className="deep-dive-toolbar-title">{isZh ? "研究报告模式" : "Research Report Mode"}</div>
          <div className="deep-dive-toolbar-subtitle">
            {isZh ? "结构化叙事 + 证据图表 + 基准差值对比。" : "Structured narrative + evidence charts + benchmark deltas."}
          </div>
        </div>
        <label className="deep-dive-select-wrap">
          <span>{isZh ? "模型" : "Model"}</span>
          <select
            className="deep-dive-select"
            value={report.modelId}
            onChange={e => setSelectedModel(e.target.value)}
          >
            {reports.map(r => (
              <option key={r.modelId} value={r.modelId}>
                #{r.rank} {r.displayName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <article className="card deep-dive-report">
        <header className="deep-dive-thesis">
          <div className="deep-dive-thesis-main">
            <p className="deep-dive-kicker">{report.comparison.relationLabel}</p>
            <h3>{report.displayName}</h3>
            <p className="deep-dive-meta">
              {isZh ? `排名 #${report.rank} · 风格：${report.strategyTitle}` : `Rank #${report.rank} · Style: ${report.strategyTitle}`}
            </p>
            <p className="deep-dive-thesis-text">{report.executiveSummary}</p>
            <p className="deep-dive-thesis-text">{report.operatingStyle}</p>
          </div>

          <div className="deep-dive-kpi-triad">
            <div className="deep-dive-kpi-pill">
              <span>{isZh ? "30天净现金" : "30-Day Net Cash"}</span>
              <strong>{formatYen(report.snapshot.netCash)}</strong>
            </div>
            <div className="deep-dive-kpi-pill">
              <span>{isZh ? "毛利率" : "Gross Margin"}</span>
              <strong>{formatPct(report.snapshot.grossMargin)}</strong>
            </div>
            <div className="deep-dive-kpi-pill">
              <span>{isZh ? "工具调用错误率" : "Tool Call Error Rate"}</span>
              <strong>{formatPct(report.snapshot.toolErrorRate)}</strong>
            </div>
          </div>
        </header>

        <section className="deep-dive-chapters">
          {report.chapters.map(chapter => (
            <article key={chapter.title} className="deep-dive-chapter">
              <div className="deep-dive-chapter-head">
                <h4>{chapter.title}</h4>
                <span>{chapter.dayRange}</span>
              </div>
              <p className="deep-dive-chapter-thesis">{chapter.thesis}</p>
              <ul className="deep-dive-list">
                {chapter.bullets.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="deep-dive-evidence-note">{chapter.evidence}</p>
            </article>
          ))}
        </section>

        <section className="card-flat deep-dive-evidence">
          <div className="deep-dive-evidence-head">
            <h3>{isZh ? "证据看板" : "Evidence Board"}</h3>
            <div className="deep-dive-tabs">
              <button
                type="button"
                className={`deep-dive-tab ${evidenceTab === "trajectory" ? "active" : ""}`}
                onClick={() => setEvidenceTab("trajectory")}
              >
                {isZh ? "净现金轨迹" : "Net Cash Trajectory"}
              </button>
              <button
                type="button"
                className={`deep-dive-tab ${evidenceTab === "inventory" ? "active" : ""}`}
                onClick={() => setEvidenceTab("inventory")}
              >
                {isZh ? "30天库存轨迹" : "30-Day Inventory Trajectory"}
              </button>
              <button
                type="button"
                className={`deep-dive-tab ${evidenceTab === "grossprofit" ? "active" : ""}`}
                onClick={() => setEvidenceTab("grossprofit")}
              >
                {isZh ? "每日毛利润" : "Daily Gross Profit"}
              </button>
              <button
                type="button"
                className={`deep-dive-tab ${evidenceTab === "netprofit" ? "active" : ""}`}
                onClick={() => setEvidenceTab("netprofit")}
              >
                {isZh ? "每日净利润" : "Daily Net Profit"}
              </button>
              <button
                type="button"
                className={`deep-dive-tab ${evidenceTab === "radar" ? "active" : ""}`}
                onClick={() => setEvidenceTab("radar")}
              >
                {isZh ? "能力雷达" : "Capability Radar"}
              </button>
              <button
                type="button"
                className={`deep-dive-tab ${evidenceTab === "toolmix" ? "active" : ""}`}
                onClick={() => setEvidenceTab("toolmix")}
              >
                {isZh ? "工具结构" : "Tool Mix"}
              </button>
            </div>
          </div>
          <p className="deep-dive-paragraph" style={{ marginTop: 0, marginBottom: "0.85rem" }}>
            {isZh
              ? "口径说明：净现金轨迹用于最终评分；每日净利润（收入-销售成本-人工-房租-贷款利息-营销-其他）与每日毛利润（收入-销售成本）用于解释经营质量；库存轨迹仅用于观察运营状态，不计入最终得分。"
              : "Methodology note: Net Cash Trajectory follows the final ranking metric; Daily Net Profit (revenue - COGS - wages - rent - loan interest - marketing - other) and Daily Gross Profit (revenue - COGS) explain operating quality; Inventory Trajectory is observational and not part of final score."}
          </p>

          {evidenceTab === "trajectory" && (
            <TrendLineChart
              data={report.charts.trendData}
              xKey="day"
              series={[
                {
                  key: report.chartKeys.model,
                  name: report.displayName,
                  color: report.colors.model,
                  type: "area",
                },
                {
                  key: report.chartKeys.reference,
                  name: report.comparison.referenceName,
                  color: report.colors.reference,
                },
              ]}
              height={320}
              showZeroLine
            />
          )}

          {evidenceTab === "inventory" && (
            <TrendLineChart
              data={report.charts.inventoryData}
              xKey="day"
              series={[
                {
                  key: report.chartKeys.model,
                  name: report.displayName,
                  color: report.colors.model,
                  type: "area",
                },
                {
                  key: report.chartKeys.reference,
                  name: report.comparison.referenceName,
                  color: report.colors.reference,
                },
              ]}
              height={320}
            />
          )}

          {evidenceTab === "grossprofit" && (
            <TrendLineChart
              data={report.charts.grossProfitData}
              xKey="day"
              series={[
                {
                  key: report.chartKeys.model,
                  name: report.displayName,
                  color: report.colors.model,
                  type: "area",
                },
                {
                  key: report.chartKeys.reference,
                  name: report.comparison.referenceName,
                  color: report.colors.reference,
                },
              ]}
              height={320}
              showZeroLine
            />
          )}

          {evidenceTab === "netprofit" && (
            <TrendLineChart
              data={report.charts.netProfitData}
              xKey="day"
              series={[
                {
                  key: report.chartKeys.model,
                  name: report.displayName,
                  color: report.colors.model,
                  type: "area",
                },
                {
                  key: report.chartKeys.reference,
                  name: report.comparison.referenceName,
                  color: report.colors.reference,
                },
              ]}
              height={320}
              showZeroLine
            />
          )}

          {evidenceTab === "radar" && (
            <RadarCompare
              data={report.charts.radarData}
              axisKey="metric"
              series={[
                { key: report.chartKeys.model, name: report.displayName, color: report.colors.model },
                { key: report.chartKeys.reference, name: report.comparison.referenceName, color: report.colors.reference },
              ]}
              height={320}
            />
          )}

          {evidenceTab === "toolmix" && (
            <GroupedBarChart
              data={report.charts.toolMixData}
              xKey="category"
              series={[
                { key: report.chartKeys.model, name: report.displayName, color: report.colors.model },
                { key: report.chartKeys.reference, name: report.comparison.referenceName, color: report.colors.reference },
              ]}
              height={320}
            />
          )}
        </section>

        <section className="card-flat deep-dive-deltas">
          <h3>{isZh ? `相对 ${report.comparison.referenceName} 的差值` : `Delta vs ${report.comparison.referenceName}`}</h3>
          <p className="deep-dive-paragraph">{report.comparisonNarrative}</p>

          <div className="deep-dive-delta-rows">
            {deltaRows.map(row => {
              const directionPositive = row.value >= 0;
              const favorable = row.betterWhenLower ? !directionPositive : directionPositive;
              const fillPct = (Math.abs(row.value) / maxAbsDelta) * 100;
              return (
                <div key={row.label} className="deep-dive-delta-row">
                  <div className="deep-dive-delta-label">{row.label}</div>
                  <div className="deep-dive-delta-bar-track">
                    <div
                      className={`deep-dive-delta-bar ${favorable ? "good" : "bad"}`}
                      style={{ width: `${Math.max(fillPct, 3)}%` }}
                    />
                  </div>
                  <div className={`deep-dive-delta-value ${favorable ? "good" : "bad"}`}>
                    {row.display}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="deep-dive-insight-columns">
          <section className="card-flat">
            <h3>{isZh ? "有效做法" : "What Worked"}</h3>
            <ul className="deep-dive-list">
              {[...report.strengths, ...report.successReasons].slice(0, 6).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="card-flat">
            <h3>{isZh ? "性能瓶颈" : "What Limited Performance"}</h3>
            <ul className="deep-dive-list">
              {[...report.weaknesses, ...report.failureReasons].slice(0, 6).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </article>
    </div>
  );
}
