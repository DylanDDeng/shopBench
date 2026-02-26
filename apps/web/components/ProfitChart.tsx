"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { day: number; profit: number; cumulative: number }[];
}

export function ProfitChart({ data }: Props) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Profit Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="day" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }}
          />
          <Line type="monotone" dataKey="profit" stroke="#60a5fa" name="Daily Profit" dot={false} />
          <Line type="monotone" dataKey="cumulative" stroke="#10b981" name="Cumulative" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
