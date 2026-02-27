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

export function DeepDiveReports({ reports }: DeepDiveReportsProps) {
  const [selectedModel, setSelectedModel] = useState(reports[0]?.modelId ?? "");

  const report = useMemo(
    () => reports.find(r => r.modelId === selectedModel) ?? reports[0],
    [reports, selectedModel],
  );

  if (!report) {
    return null;
  }

  return (
    <div className="deep-dive-shell">
      <div className="card deep-dive-toolbar">
        <div>
          <div className="deep-dive-toolbar-title">Select Model Report</div>
          <div className="deep-dive-toolbar-subtitle">
            Each report combines long-form analysis with chart evidence and benchmark comparison.
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

      <article className="card deep-dive-article">
        <div className="deep-dive-headline">
          <div>
            <h3>{report.displayName}</h3>
            <p className="deep-dive-meta">
              Rank #{report.rank} · Style: {report.strategyTitle}
            </p>
          </div>
          <div className="deep-dive-badge">{report.comparison.relationLabel}</div>
        </div>

        <p className="deep-dive-paragraph">{report.executiveSummary}</p>
        <p className="deep-dive-paragraph">{report.operatingStyle}</p>

        <div className="deep-dive-kpis">
          <div className="deep-dive-kpi">
            <span>30-Day Net Cash</span>
            <strong>{formatYen(report.snapshot.netCash)}</strong>
          </div>
          <div className="deep-dive-kpi">
            <span>Total Revenue</span>
            <strong>{formatYen(report.snapshot.totalRevenue)}</strong>
          </div>
          <div className="deep-dive-kpi">
            <span>Gross Margin</span>
            <strong>{formatPct(report.snapshot.grossMargin)}</strong>
          </div>
          <div className="deep-dive-kpi">
            <span>Tool Call Error Rate</span>
            <strong>{formatPct(report.snapshot.toolErrorRate)}</strong>
          </div>
          <div className="deep-dive-kpi">
            <span>Tool Calls</span>
            <strong>{report.snapshot.toolCalls}</strong>
          </div>
          <div className="deep-dive-kpi">
            <span>Profitable / Zero-Revenue Days</span>
            <strong>{report.snapshot.profitableDays} / {report.snapshot.zeroRevenueDays}</strong>
          </div>
        </div>

        <div className="grid-2">
          <div className="card-flat">
            <h3>30-Day Net Cash Trajectory</h3>
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
              height={280}
              showZeroLine
            />
          </div>
          <div className="card-flat">
            <h3>Capability Radar vs {report.comparison.referenceName}</h3>
            <RadarCompare
              data={report.charts.radarData}
              axisKey="metric"
              series={[
                { key: report.chartKeys.model, name: report.displayName, color: report.colors.model },
                { key: report.chartKeys.reference, name: report.comparison.referenceName, color: report.colors.reference },
              ]}
              height={280}
            />
          </div>
        </div>

        <div className="card-flat" style={{ marginTop: "1rem" }}>
          <h3>Tool Category Mix vs {report.comparison.referenceName}</h3>
          <GroupedBarChart
            data={report.charts.toolMixData}
            xKey="category"
            series={[
              { key: report.chartKeys.model, name: report.displayName, color: report.colors.model },
              { key: report.chartKeys.reference, name: report.comparison.referenceName, color: report.colors.reference },
            ]}
            height={280}
          />
        </div>

        <div className="deep-dive-columns">
          <section className="card-flat">
            <h3>What The Model Did</h3>
            <ul className="deep-dive-list">
              {report.actionHighlights.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="card-flat">
            <h3>What Worked Well</h3>
            <ul className="deep-dive-list">
              {report.strengths.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="card-flat">
            <h3>What Did Not Work</h3>
            <ul className="deep-dive-list">
              {report.weaknesses.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="card-flat">
            <h3>Why It Succeeded</h3>
            <ul className="deep-dive-list">
              {report.successReasons.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="card-flat">
            <h3>Why It Failed</h3>
            <ul className="deep-dive-list">
              {report.failureReasons.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="card-flat deep-dive-comparison">
          <h3>Head-to-Head: {report.displayName} vs {report.comparison.referenceName}</h3>
          <p className="deep-dive-paragraph" style={{ marginBottom: "0.75rem" }}>
            {report.comparisonNarrative}
          </p>
          <div className="deep-dive-delta-grid">
            <div>
              <span>Net Cash Gap</span>
              <strong>{formatYen(report.comparison.netCashDiff)}</strong>
            </div>
            <div>
              <span>Revenue Gap</span>
              <strong>{formatYen(report.comparison.revenueDiff)}</strong>
            </div>
            <div>
              <span>Gross Margin Gap</span>
              <strong>{(report.comparison.marginDiff * 100).toFixed(1)} pts</strong>
            </div>
            <div>
              <span>Error Rate Gap</span>
              <strong>{(report.comparison.errorRateDiff * 100).toFixed(1)} pts</strong>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
