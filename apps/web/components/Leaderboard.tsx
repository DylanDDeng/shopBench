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
      <table>
        <thead>
          <tr>
            <th style={{ width: 60 }}>Rank</th>
            <th>Model</th>
            <th className="text-right">Score</th>
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
