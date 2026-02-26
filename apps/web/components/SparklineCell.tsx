"use client";

import { LineChart, Line, ResponsiveContainer, ReferenceLine } from "recharts";

interface SparklineCellProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  showZero?: boolean;
}

export function SparklineCell({
  data,
  color = "#60a5fa",
  width = 120,
  height = 32,
  showZero = false,
}: SparklineCellProps) {
  const chartData = data.map((v, i) => ({ i, v }));
  const hasNegative = data.some(v => v < 0);

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          {(showZero || hasNegative) && (
            <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="2 2" />
          )}
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
