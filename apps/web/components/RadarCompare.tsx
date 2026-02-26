"use client";

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend, ResponsiveContainer, Tooltip,
} from "recharts";
import { CHART_THEME } from "@/lib/chartConfig";

interface RadarSeries {
  key: string;
  name: string;
  color: string;
}

interface RadarCompareProps {
  data: Record<string, unknown>[];
  axisKey: string;
  series: RadarSeries[];
  height?: number;
}

export function RadarCompare({
  data,
  axisKey,
  series,
  height = 400,
}: RadarCompareProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#2a2a2a" />
        <PolarAngleAxis
          dataKey={axisKey}
          tick={{ fill: "#a0a0a0", fontSize: 12 }}
        />
        <PolarRadiusAxis
          tick={{ fill: "#666", fontSize: 10 }}
          domain={[0, 100]}
          axisLine={false}
        />
        <Tooltip {...CHART_THEME.tooltip} />
        <Legend />
        {series.map(s => (
          <Radar
            key={s.key}
            name={s.name}
            dataKey={s.key}
            stroke={s.color}
            fill={s.color}
            fillOpacity={0.15}
            strokeWidth={2}
            animationDuration={CHART_THEME.animation.duration}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}
