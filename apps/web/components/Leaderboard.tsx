"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { SimulationResult, DerivedMetrics } from "@/lib/types";
import { formatYen, formatPct } from "@/lib/types";
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

function ModelNameMarquee({ name }: { name: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const text = textRef.current;
      if (!container || !text) return;

      const overflowDistance = Math.max(0, text.scrollWidth - container.clientWidth);
      setOverflow(overflowDistance > 4);
      setDistance(overflowDistance + 12);
    };

    measure();

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(measure)
      : null;

    if (resizeObserver) {
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      if (textRef.current) resizeObserver.observe(textRef.current);
    }

    window.addEventListener("resize", measure);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [name]);

  const durationSeconds = Math.max(4, distance / 36);

  return (
    <div
      ref={containerRef}
      className={`model-marquee ${overflow ? "is-overflow" : ""}`}
      title={name}
      style={
        {
          "--marquee-distance": `${distance}px`,
          "--marquee-duration": `${durationSeconds}s`,
        } as CSSProperties
      }
    >
      <span ref={textRef}>{name}</span>
    </div>
  );
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
            <strong>Gross Margin:</strong> (Revenue - COGS) / Revenue for sold items.
          </li>
          <li>
            <strong>Tool Call Error Rate:</strong> Percentage of tool calls that returned errors.
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
            <th className="model-col">Model</th>
            <th className="text-right">30-Day Net Cash (¥)</th>
            <th className="text-right">Gross Margin</th>
            <th className="text-right">Tool Call Error Rate</th>
            <th>30-Day Profit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => {
            const dm = derivedMetrics[i];
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
                <td className="model-cell">
                  <ModelNameMarquee name={r.model} />
                </td>
                <td className={`text-right ${r.finalScore >= 0 ? "profit-positive" : "profit-negative"}`}>
                  {formatYen(r.finalScore)}
                </td>
                <td className="text-right">{formatPct(dm.grossMargin)}</td>
                <td className="text-right">{formatPct(dm.errorRate)}</td>
                <td className="sparkline-cell">
                  <SparklineCell
                    data={profitCurve}
                    color={r.finalScore >= 0 ? "#10b981" : "#ef4444"}
                    showZero
                    animationDelay={sparklineDelay}
                  />
                </td>
                <td className="leaderboard-actions">
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
