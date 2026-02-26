"use client";

import { useState } from "react";
import type { DayData } from "@/lib/types";
import { formatYen } from "@/lib/types";
import { DayContextPanel } from "@/components/DayContextPanel";
import { ToolCallCard } from "@/components/ToolCallCard";

interface ReplayViewProps {
  days: DayData[];
  resultId: string;
}

export function ReplayView({ days }: ReplayViewProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const day = days[selectedDay];

  if (!day) return <div className="card"><p>No data available</p></div>;

  const errors = day.toolCalls.filter(tc => {
    return typeof tc.result === "object" && tc.result !== null && "error" in (tc.result as Record<string, unknown>);
  });

  return (
    <div>
      {/* Day selector strip */}
      <div className="day-strip">
        {days.map((d, i) => (
          <button
            key={i}
            className={`day-btn ${i === selectedDay ? "active" : ""}`}
            onClick={() => setSelectedDay(i)}
          >
            {d.day}
          </button>
        ))}
      </div>

      <div className="replay-layout">
        {/* Main content */}
        <div className="replay-main">
          {/* Morning Brief */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <h3 style={{ margin: 0 }}>Morning Brief</h3>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Day {day.day}
              </span>
            </div>
            <pre style={{
              whiteSpace: "pre-wrap",
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.6,
              fontFamily: "var(--font-mono)",
            }}>
              {day.morningBrief}
            </pre>
          </div>

          {/* Tool Calls */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <h3 style={{ margin: 0 }}>Tool Calls</h3>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                {day.toolCalls.length} calls
                {errors.length > 0 && (
                  <span style={{ color: "var(--accent-red)", marginLeft: "0.5rem" }}>
                    ({errors.length} error{errors.length !== 1 ? "s" : ""})
                  </span>
                )}
              </span>
            </div>
            {day.toolCalls.map((tc, i) => (
              <ToolCallCard key={i} call={tc} index={i} />
            ))}
          </div>

          {/* Settlement */}
          <div className="card" style={{ borderLeft: "3px solid var(--accent-green)" }}>
            <h3 style={{ margin: "0 0 0.75rem", color: "var(--accent-green)" }}>Day Settlement</h3>
            <div className="grid-4">
              <div>
                <div className="metric-label">Customers</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{day.settlement.customerCount}</div>
              </div>
              <div>
                <div className="metric-label">Revenue</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--accent-blue)" }}>
                  {formatYen(day.settlement.revenue)}
                </div>
              </div>
              <div>
                <div className="metric-label">Expenses</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                  {formatYen(day.settlement.expenses)}
                </div>
              </div>
              <div>
                <div className="metric-label">Net Profit</div>
                <div style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: day.settlement.netProfit >= 0 ? "var(--accent-green)" : "var(--accent-red)",
                }}>
                  {formatYen(day.settlement.netProfit)}
                </div>
              </div>
            </div>

            {day.settlement.itemsSold.length > 0 && (
              <details style={{ marginTop: "1rem" }}>
                <summary style={{ cursor: "pointer", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  Items sold ({day.settlement.itemsSold.length})
                </summary>
                <table style={{ marginTop: "0.5rem" }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.settlement.itemsSold.map((item, i) => (
                      <tr key={i}>
                        <td>{item.productId}</td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">{formatYen(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}

            {day.settlement.expiredItems.length > 0 && (
              <div style={{ marginTop: "0.75rem", padding: "0.5rem", background: "rgba(239, 68, 68, 0.05)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--accent-red)" }}>
                  Expired: {day.settlement.expiredItems.map(e => `${e.productId} (${e.quantity})`).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar context panel */}
        <DayContextPanel days={days} currentDay={selectedDay} />
      </div>
    </div>
  );
}
