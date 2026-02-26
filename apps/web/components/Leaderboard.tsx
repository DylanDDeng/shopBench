"use client";

import type { SimulationResult, DerivedMetrics } from "@/lib/types";
import { getModelDisplayName, formatYen, formatPct } from "@/lib/types";
import { SparklineCell } from "./SparklineCell";

interface LeaderboardProps {
  results: SimulationResult[];
  derivedMetrics: DerivedMetrics[];
}

function getRankBadge(rank: number) {
  if (rank === 0) return <span className="badge badge-gold">1st</span>;
  if (rank === 1) return <span className="badge badge-silver">2nd</span>;
  if (rank === 2) return <span className="badge badge-bronze">3rd</span>;
  return <span className="badge-rank">{rank + 1}</span>;
}

export function Leaderboard({ results, derivedMetrics }: LeaderboardProps) {
  return (
    <div className="card leaderboard-table">
      <details className="metrics-guide">
        <summary>Metrics Guide</summary>
        <p className="metrics-guide-intro">
          Quick definitions for the leaderboard columns:
        </p>
        <ul className="metrics-guide-list">
          <li>
            <strong>30-Day Net Cash (¥):</strong> Final cash minus starting cash minus outstanding loans; this is the ranking metric.
          </li>
          <li>
            <strong>Final Cash:</strong> Cash on hand at the end of Day 30 before subtracting loans.
          </li>
          <li>
            <strong>Gross Margin:</strong> (Revenue - COGS) / Revenue for sold items.
          </li>
          <li>
            <strong>Tool Calls:</strong> Total number of tool invocations across 30 days.
          </li>
          <li>
            <strong>Errors:</strong> Number of tool calls that returned an error.
          </li>
          <li>
            <strong>Satisfaction:</strong> Customer satisfaction change from start to end (start → end).
          </li>
          <li>
            <strong>Reputation:</strong> Store reputation change from start to end (start → end).
          </li>
          <li>
            <strong>30-Day Profit:</strong> Cumulative daily net profit trend over 30 days (sparkline).
          </li>
        </ul>
      </details>

      <table>
        <thead>
          <tr>
            <th style={{ width: 60 }}>Rank</th>
            <th>Model</th>
            <th className="text-right">30-Day Net Cash (¥)</th>
            <th className="text-right">Final Cash</th>
            <th className="text-right">Gross Margin</th>
            <th className="text-right">Tool Calls</th>
            <th className="text-right">Errors</th>
            <th>Satisfaction</th>
            <th>Reputation</th>
            <th>30-Day Profit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => {
            const dm = derivedMetrics[i];
            const sat = r.metrics.customerSatisfactionTrend;
            const rep = r.metrics.reputationTrend ?? [];
            const totalErrors = Object.values(dm.errorsByType).reduce((a, b) => a + b, 0);
            // Cumulative profit for sparkline
            let cum = 0;
            const profitCurve = r.metrics.dailyProfitTrend.map(p => {
              cum += p;
              return Math.round(cum);
            });
            const sparklineDelay = Math.min(i * 70, 560);

            return (
              <tr key={r.id}>
                <td>{getRankBadge(i)}</td>
                <td><strong>{getModelDisplayName(r.model)}</strong></td>
                <td className={`text-right ${r.finalScore >= 0 ? "profit-positive" : "profit-negative"}`}>
                  {formatYen(r.finalScore)}
                </td>
                <td className="text-right">{formatYen(r.metrics.finalCash)}</td>
                <td className="text-right">{formatPct(dm.grossMargin)}</td>
                <td className="text-right">{r.metrics.totalToolCalls}</td>
                <td className="text-right" style={{ color: totalErrors > 0 ? "var(--accent-red)" : "var(--text-muted)" }}>
                  {totalErrors}
                </td>
                <td>
                  <span style={{ color: "var(--text-muted)" }}>{sat[0]?.toFixed(0) ?? "–"}</span>
                  <span style={{ color: "var(--text-muted)", margin: "0 0.25rem" }}>→</span>
                  <span>{sat[sat.length - 1]?.toFixed(0) ?? "–"}</span>
                </td>
                <td>
                  <span style={{ color: "var(--text-muted)" }}>{rep[0]?.toFixed(0) ?? "–"}</span>
                  <span style={{ color: "var(--text-muted)", margin: "0 0.25rem" }}>→</span>
                  <span>{rep[rep.length - 1]?.toFixed(0) ?? "–"}</span>
                </td>
                <td className="sparkline-cell">
                  <SparklineCell
                    data={profitCurve}
                    color={r.finalScore >= 0 ? "#10b981" : "#ef4444"}
                    showZero
                    animationDelay={sparklineDelay}
                  />
                </td>
                <td>
                  <a href={`/report/${r.id}`} className="action-link">Report</a>
                  <a href={`/replay/${r.id}`} className="action-link">Replay</a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
