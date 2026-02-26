"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { CHART_THEME } from "@/lib/chartConfig";

interface BarItem {
  name: string;
  value: number;
  color?: string;
}

interface HorizontalBarChartProps {
  data: BarItem[];
  height?: number;
  defaultColor?: string;
}

export function HorizontalBarChart({
  data,
  height,
  defaultColor = "#60a5fa",
}: HorizontalBarChartProps) {
  const computedHeight = height ?? Math.max(200, data.length * 36);

  return (
    <ResponsiveContainer width="100%" height={computedHeight}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid {...CHART_THEME.grid} horizontal={false} />
        <XAxis type="number" {...CHART_THEME.axis} />
        <YAxis
          type="category"
          dataKey="name"
          {...CHART_THEME.axis}
          width={140}
          tick={{ fontSize: 12 }}
        />
        <Tooltip {...CHART_THEME.tooltip} />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          animationDuration={CHART_THEME.animation.duration}
        >
          {data.map((item, i) => (
            <Cell key={i} fill={item.color ?? defaultColor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
