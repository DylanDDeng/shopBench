"use client";

import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  Label,
} from "recharts";
import { CHART_THEME } from "@/lib/chartConfig";
import { formatYen } from "@/lib/types";

interface ScatterDataPoint {
  displayName: string;
  setPriceCalls: number;
  netProfit: number;
  totalRevenue: number;
  color: string;
}

interface ScatterChartProps {
  data: ScatterDataPoint[];
  height?: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterDataPoint }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div style={CHART_THEME.tooltip.contentStyle}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.displayName}</div>
      <div>Price Changes: {d.setPriceCalls}</div>
      <div>Net Profit: {formatYen(d.netProfit)}</div>
      <div>Revenue: {formatYen(d.totalRevenue)}</div>
    </div>
  );
}

function CustomLabel({ viewBox, value }: { viewBox?: { x: number; y: number }; value: string }) {
  if (!viewBox) return null;
  return (
    <text x={viewBox.x} y={viewBox.y - 10} fill="#a0a0a0" fontSize={11} textAnchor="middle">
      {value}
    </text>
  );
}

export function PriceVsProfitScatter({ data, height = 400 }: ScatterChartProps) {
  const revenueRange = [
    Math.min(...data.map(d => d.totalRevenue)),
    Math.max(...data.map(d => d.totalRevenue)),
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <CartesianGrid {...CHART_THEME.grid} />
        <XAxis
          type="number"
          dataKey="setPriceCalls"
          name="Price Changes"
          {...CHART_THEME.axis}
        >
          <Label value="Price Changes (set_price calls)" position="bottom" offset={0} fill="#666" fontSize={12} />
        </XAxis>
        <YAxis
          type="number"
          dataKey="netProfit"
          name="Net Profit"
          tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`}
          {...CHART_THEME.axis}
        >
          <Label value="Net Profit (¥)" position="left" angle={-90} offset={10} fill="#666" fontSize={12} />
        </YAxis>
        <ZAxis
          type="number"
          dataKey="totalRevenue"
          range={[200, 1200]}
          domain={revenueRange}
          name="Revenue"
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} {...CHART_THEME.referenceLine} />
        <Scatter data={data} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} fillOpacity={0.7} stroke={entry.color} strokeWidth={1} />
          ))}
        </Scatter>
        {data.map((d, i) => (
          <ReferenceLine
            key={i}
            x={d.setPriceCalls}
            y={d.netProfit}
            ifOverflow="extendDomain"
            label={<CustomLabel value={d.displayName} />}
            stroke="transparent"
          />
        ))}
      </RechartsScatterChart>
    </ResponsiveContainer>
  );
}
