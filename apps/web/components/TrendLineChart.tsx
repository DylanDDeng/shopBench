"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart,
} from "recharts";
import { CHART_THEME } from "@/lib/chartConfig";

interface Series {
  key: string;
  name: string;
  color: string;
  type?: "line" | "area";
  dashed?: boolean;
}

interface TrendLineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: Series[];
  height?: number;
  showZeroLine?: boolean;
  yDomain?: [number | "auto", number | "auto"];
}

export function TrendLineChart({
  data,
  xKey,
  series,
  height = 300,
  showZeroLine = false,
  yDomain,
}: TrendLineChartProps) {
  const hasArea = series.some(s => s.type === "area");

  if (hasArea) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid {...CHART_THEME.grid} />
          <XAxis dataKey={xKey} {...CHART_THEME.axis} />
          <YAxis {...CHART_THEME.axis} domain={yDomain} />
          <Tooltip {...CHART_THEME.tooltip} />
          <Legend />
          {showZeroLine && <ReferenceLine y={0} {...CHART_THEME.referenceLine} />}
          {series.map(s =>
            s.type === "area" ? (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.1}
                strokeWidth={2}
                dot={false}
                animationDuration={CHART_THEME.animation.duration}
              />
            ) : (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? "5 5" : undefined}
                dot={false}
                animationDuration={CHART_THEME.animation.duration}
              />
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid {...CHART_THEME.grid} />
        <XAxis dataKey={xKey} {...CHART_THEME.axis} />
        <YAxis {...CHART_THEME.axis} domain={yDomain} />
        <Tooltip {...CHART_THEME.tooltip} />
        <Legend />
        {showZeroLine && <ReferenceLine y={0} {...CHART_THEME.referenceLine} />}
        {series.map(s => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "5 5" : undefined}
            dot={false}
            animationDuration={CHART_THEME.animation.duration}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
