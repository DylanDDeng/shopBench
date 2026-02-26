"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CHART_THEME } from "@/lib/chartConfig";

const COLORS = ["#60a5fa", "#10b981", "#f59e0b", "#ef4444", "#a78bfa", "#ec4899"];

interface CompareResult {
  model: string;
  dailyProfitTrend: number[];
}

export function CompareChart({ results }: { results: CompareResult[] }) {
  if (results.length === 0) return <p>No data to compare</p>;

  const maxDays = Math.max(...results.map(r => r.dailyProfitTrend.length));
  const data = Array.from({ length: maxDays }, (_, i) => {
    const point: Record<string, number> = { day: i + 1 };
    for (const r of results) {
      let cumulative = 0;
      for (let j = 0; j <= i && j < r.dailyProfitTrend.length; j++) {
        cumulative += r.dailyProfitTrend[j];
      }
      point[r.model] = Math.round(cumulative * 100) / 100;
    }
    return point;
  });

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Cumulative Profit Comparison</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid {...CHART_THEME.grid} />
          <XAxis dataKey="day" {...CHART_THEME.axis} />
          <YAxis {...CHART_THEME.axis} />
          <Tooltip {...CHART_THEME.tooltip} />
          <Legend />
          {results.map((r, i) => (
            <Line
              key={r.model}
              type="monotone"
              dataKey={r.model}
              stroke={COLORS[i % COLORS.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
