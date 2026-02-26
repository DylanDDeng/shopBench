"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { CHART_THEME } from "@/lib/chartConfig";

interface BarSeries {
  key: string;
  name: string;
  color: string;
}

interface GroupedBarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: BarSeries[];
  height?: number;
  layout?: "horizontal" | "vertical";
}

export function GroupedBarChart({
  data,
  xKey,
  series,
  height = 300,
  layout = "vertical",
}: GroupedBarChartProps) {
  if (layout === "horizontal") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid {...CHART_THEME.grid} horizontal={false} />
          <XAxis type="number" {...CHART_THEME.axis} />
          <YAxis type="category" dataKey={xKey} {...CHART_THEME.axis} width={120} />
          <Tooltip {...CHART_THEME.tooltip} />
          <Legend />
          {series.map(s => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              radius={[0, 4, 4, 0]}
              animationDuration={CHART_THEME.animation.duration}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid {...CHART_THEME.grid} />
        <XAxis dataKey={xKey} {...CHART_THEME.axis} />
        <YAxis {...CHART_THEME.axis} />
        <Tooltip {...CHART_THEME.tooltip} />
        <Legend />
        {series.map(s => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={s.color}
            radius={[4, 4, 0, 0]}
            animationDuration={CHART_THEME.animation.duration}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
