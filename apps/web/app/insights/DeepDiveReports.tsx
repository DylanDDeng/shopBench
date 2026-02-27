"use client";

import { useMemo, useState } from "react";
import { GroupedBarChart } from "@/components/GroupedBarChart";
import { RadarCompare } from "@/components/RadarCompare";
import { TrendLineChart } from "@/components/TrendLineChart";
import { formatPct, formatYen } from "@/lib/types";

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
}

type EvidenceTab = "trajectory" | "radar" | "toolmix";

export function DeepDiveReports({ reports }: DeepDiveReportsProps) {
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
      label: "Net Cash Gap",
      value: report.comparison.netCashDiff,
      display: formatYen(report.comparison.netCashDiff),
      betterWhenLower: false,
    },
    {
      label: "Revenue Gap",
      value: report.comparison.revenueDiff,
      display: formatYen(report.comparison.revenueDiff),
      betterWhenLower: false,
    },
    {
      label: "Gross Margin Gap",
      value: report.comparison.marginDiff,
      display: `${(report.comparison.marginDiff * 100).toFixed(1)} pts`,
      betterWhenLower: false,
    },
    {
      label: "Error Rate Gap",
      value: report.comparison.errorRateDiff,
      display: `${(report.comparison.errorRateDiff * 100).toFixed(1)} pts`,
      betterWhenLower: true,
    },
  ];
  const maxAbsDelta = Math.max(0.001, ...deltaRows.map(row => Math.abs(row.value)));

  return (
    <div className="deep-dive-shell">
      <div className="card deep-dive-toolbar">
        <div>
          <div className="deep-dive-toolbar-title">Research Report Mode</div>
          <div className="deep-dive-toolbar-subtitle">
            Structured narrative + evidence charts + benchmark deltas.
          </div>
        </div>
        <label className="deep-dive-select-wrap">
          <span>Model</span>
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
              Rank #{report.rank} · Style: {report.strategyTitle}
            </p>
            <p className="deep-dive-thesis-text">{report.executiveSummary}</p>
            <p className="deep-dive-thesis-text">{report.operatingStyle}</p>
          </div>

          <div className="deep-dive-kpi-triad">
            <div className="deep-dive-kpi-pill">
              <span>30-Day Net Cash</span>
              <strong>{formatYen(report.snapshot.netCash)}</strong>
            </div>
            <div className="deep-dive-kpi-pill">
              <span>Gross Margin</span>
              <strong>{formatPct(report.snapshot.grossMargin)}</strong>
            </div>
            <div className="deep-dive-kpi-pill">
              <span>Tool Call Error Rate</span>
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
            <h3>Evidence Board</h3>
            <div className="deep-dive-tabs">
              <button
                type="button"
                className={`deep-dive-tab ${evidenceTab === "trajectory" ? "active" : ""}`}
                onClick={() => setEvidenceTab("trajectory")}
              >
                Net Cash Trajectory
              </button>
              <button
                type="button"
                className={`deep-dive-tab ${evidenceTab === "radar" ? "active" : ""}`}
                onClick={() => setEvidenceTab("radar")}
              >
                Capability Radar
              </button>
              <button
                type="button"
                className={`deep-dive-tab ${evidenceTab === "toolmix" ? "active" : ""}`}
                onClick={() => setEvidenceTab("toolmix")}
              >
                Tool Mix
              </button>
            </div>
          </div>

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
          <h3>Delta vs {report.comparison.referenceName}</h3>
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
            <h3>What Worked</h3>
            <ul className="deep-dive-list">
              {[...report.strengths, ...report.successReasons].slice(0, 6).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="card-flat">
            <h3>What Limited Performance</h3>
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
