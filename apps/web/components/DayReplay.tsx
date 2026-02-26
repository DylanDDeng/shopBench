"use client";

import { useState } from "react";
import { Timeline } from "./Timeline";

interface DayData {
  day: number;
  morningBrief: string;
  toolCalls: { name: string; arguments: Record<string, unknown>; result: unknown }[];
  settlement: {
    revenue: number;
    expenses: number;
    netProfit: number;
    customerCount: number;
    summary: string;
  };
}

export function DayReplay({ days }: { days: DayData[] }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const day = days[selectedDay];

  if (!day) return <p>No data</p>;

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {days.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            style={{
              padding: "0.5rem 0.75rem",
              background: i === selectedDay ? "var(--accent-blue)" : "var(--bg-card)",
              color: i === selectedDay ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border-primary)",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Day {d.day}
          </button>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>
          Day {day.day} — {day.toolCalls.length} tool calls
        </h3>
        <Timeline
          toolCalls={day.toolCalls}
          settlement={day.settlement}
          morningBrief={day.morningBrief}
        />
      </div>
    </div>
  );
}
