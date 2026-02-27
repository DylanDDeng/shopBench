"use client";

import { useMemo, useState } from "react";
import { formatPct, formatYen } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface DiagnosticDay {
  day: number;
  title: string;
  reason: string;
  actions: string;
  impact: string;
  severity: "high" | "medium" | "low";
}

interface ModelDiagnostic {
  model: string;
  displayName: string;
  rank: number;
  netCash: number;
  grossMargin: number;
  whyMarginPositive: string;
  didWell: string[];
  didPoorly: string[];
  criticalDays: DiagnosticDay[];
}

interface ModelDiagnosticsPanelProps {
  diagnostics: ModelDiagnostic[];
  locale?: Locale;
}

function getRiskScore(diag: ModelDiagnostic): number {
  const severityPoints = diag.criticalDays.reduce((sum, day) => {
    if (day.severity === "high") return sum + 20;
    if (day.severity === "medium") return sum + 12;
    return sum + 6;
  }, 0);

  const cashPenalty = diag.netCash < 0 ? Math.min(45, Math.round(Math.abs(diag.netCash) / 300)) : 5;
  return Math.max(0, Math.min(100, severityPoints + cashPenalty));
}

function getRiskTone(score: number): "high" | "medium" | "low" {
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function ModelDiagnosticsPanel({ diagnostics, locale = "en" }: ModelDiagnosticsPanelProps) {
  const isZh = locale === "zh";
  const [selectedModel, setSelectedModel] = useState(diagnostics[0]?.model ?? "");

  const selected = useMemo(
    () => diagnostics.find(d => d.model === selectedModel) ?? diagnostics[0],
    [diagnostics, selectedModel],
  );

  if (!selected) return null;

  const riskScore = getRiskScore(selected);
  const riskTone = getRiskTone(riskScore);

  const text = isZh
    ? {
        title: "模型因果诊断",
        subtitle: "逐模型拆解：毛利率来源、优劣动作与关键问题日",
        netCash: "30天净现金",
        grossMargin: "毛利率",
        riskScore: "风险分",
        rankPrefix: "排名",
        whyTitle: "毛利率为何为正",
        wellTitle: "做得好的地方",
        badTitle: "做得不好的地方",
        criticalTitle: "关键问题日时间线",
        reason: "原因",
        actions: "触发操作",
        impact: "影响",
      }
    : {
        title: "Model Causal Diagnostics",
        subtitle: "Per-model breakdown of margin drivers, good/bad actions, and critical days",
        netCash: "30-Day Net Cash",
        grossMargin: "Gross Margin",
        riskScore: "Risk Score",
        rankPrefix: "Rank",
        whyTitle: "Why Margin Stays Positive",
        wellTitle: "What It Did Well",
        badTitle: "What Hurt Performance",
        criticalTitle: "Critical Days Timeline",
        reason: "Reason",
        actions: "Triggering Actions",
        impact: "Impact",
      };

  return (
    <section className="insights-block">
      <div className="insights-block-head">
        <h2>{text.title}</h2>
        <span className="insights-block-subtitle">{text.subtitle}</span>
      </div>

      <div className="diagnostic-shell card-flat">
        <div className="diagnostic-model-tabs">
          {diagnostics.map(diag => (
            <button
              key={diag.model}
              type="button"
              className={`diagnostic-tab ${diag.model === selected.model ? "active" : ""}`}
              onClick={() => setSelectedModel(diag.model)}
            >
              <span>{diag.displayName}</span>
              <small>{text.rankPrefix} #{diag.rank}</small>
            </button>
          ))}
        </div>

        <div className="diagnostic-metric-grid">
          <div className="diagnostic-metric">
            <span>{text.netCash}</span>
            <strong className={selected.netCash >= 0 ? "profit-positive" : "profit-negative"}>
              {formatYen(selected.netCash)}
            </strong>
          </div>
          <div className="diagnostic-metric">
            <span>{text.grossMargin}</span>
            <strong>{formatPct(selected.grossMargin)}</strong>
          </div>
          <div className={`diagnostic-metric risk-${riskTone}`}>
            <span>{text.riskScore}</span>
            <strong>{riskScore}</strong>
          </div>
        </div>

        <div className="diagnostic-why card-flat">
          <h3>{text.whyTitle}</h3>
          <p>{selected.whyMarginPositive}</p>
        </div>

        <div className="diagnostic-columns">
          <article className="diagnostic-list-card good">
            <h3>{text.wellTitle}</h3>
            <ul className="diagnostic-list">
              {selected.didWell.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="diagnostic-list-card bad">
            <h3>{text.badTitle}</h3>
            <ul className="diagnostic-list">
              {selected.didPoorly.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className="diagnostic-timeline">
          <h3>{text.criticalTitle}</h3>
          <div className="diagnostic-timeline-stack">
            {selected.criticalDays.map((day, idx) => (
              <article key={`${selected.model}-${day.day}-${idx}`} className="diagnostic-day">
                <div className={`diagnostic-day-badge ${day.severity}`}>
                  Day {day.day}
                </div>
                <div className="diagnostic-day-body">
                  <p className="diagnostic-day-title">{day.title}</p>
                  <p><strong>{text.reason}:</strong> {day.reason}</p>
                  <p><strong>{text.actions}:</strong> {day.actions}</p>
                  <p><strong>{text.impact}:</strong> {day.impact}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
