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
  ReferenceArea,
  ResponsiveContainer,
  Cell,
  Label,
} from "recharts";
import { CHART_THEME } from "@/lib/chartConfig";
import { formatYen } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

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
  locale?: Locale;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function CustomTooltip({
  active,
  payload,
  locale = "en",
}: {
  active?: boolean;
  payload?: Array<{ payload: ScatterDataPoint }>;
  locale?: Locale;
}) {
  if (!active || !payload?.[0]) return null;
  const isZh = locale === "zh";
  const d = payload[0].payload;
  return (
    <div style={CHART_THEME.tooltip.contentStyle}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.displayName}</div>
      <div>{isZh ? "调价次数" : "Price Changes"}: {d.setPriceCalls}</div>
      <div>{isZh ? "净现金" : "Net Cash"}: {formatYen(d.netProfit)}</div>
      <div>{isZh ? "收入" : "Revenue"}: {formatYen(d.totalRevenue)}</div>
    </div>
  );
}

function CustomLabel({
  viewBox,
  value,
  dy = -10,
}: {
  viewBox?: { x: number; y: number };
  value: string;
  dy?: number;
}) {
  if (!viewBox) return null;
  return (
    <text x={viewBox.x} y={viewBox.y + dy} fill="#64748b" fontSize={11} textAnchor="middle">
      {value}
    </text>
  );
}

export function PriceVsProfitScatter({ data, height = 400, locale = "en" }: ScatterChartProps) {
  const isZh = locale === "zh";
  if (data.length === 0) return null;

  const xValues = data.map(d => d.setPriceCalls);
  const yValues = data.map(d => d.netProfit);
  const revenueValues = data.map(d => d.totalRevenue);
  const xMedian = median(xValues);
  const yMedian = median(yValues);
  const xMin = Math.max(0, Math.min(...xValues) - 5);
  const xMax = Math.max(...xValues) + 8;
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const yPadding = Math.max(1200, (yMax - yMin) * 0.16);
  const yDomainMin = Math.floor((yMin - yPadding) / 500) * 500;
  const yDomainMax = Math.ceil((yMax + yPadding) / 500) * 500;

  const byProfitDesc = [...data].sort((a, b) => b.netProfit - a.netProfit);
  const byProfitAsc = [...data].sort((a, b) => a.netProfit - b.netProfit);
  const byRevenueDesc = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const highlightNames = new Set(
    [
      ...byProfitDesc.slice(0, 3),
      ...byProfitAsc.slice(0, 3),
      ...byRevenueDesc.slice(0, 2),
    ].map(d => d.displayName),
  );
  const labelledData = data.filter(d => highlightNames.has(d.displayName));
  const revenueRange = [
    Math.min(...revenueValues),
    Math.max(...revenueValues),
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsScatterChart margin={{ top: 26, right: 42, bottom: 24, left: 44 }}>
        <CartesianGrid {...CHART_THEME.grid} />
        <XAxis
          type="number"
          dataKey="setPriceCalls"
          name={isZh ? "调价次数" : "Price Changes"}
          domain={[xMin, xMax]}
          {...CHART_THEME.axis}
        >
          <Label value={isZh ? "调价次数（set_price 调用）" : "Price Changes (set_price calls)"} position="bottom" offset={0} fill="#64748b" fontSize={12} />
        </XAxis>
        <YAxis
          type="number"
          dataKey="netProfit"
          name={isZh ? "净现金" : "Net Cash"}
          domain={[yDomainMin, yDomainMax]}
          tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`}
          {...CHART_THEME.axis}
        >
          <Label value={isZh ? "净现金 (¥)" : "Net Cash (¥)"} position="left" angle={-90} offset={10} fill="#64748b" fontSize={12} />
        </YAxis>
        <ZAxis
          type="number"
          dataKey="totalRevenue"
          range={[110, 520]}
          domain={revenueRange}
          name={isZh ? "收入" : "Revenue"}
        />
        <Tooltip content={<CustomTooltip locale={locale} />} />
        {yMax > 0 && (
          <>
            <ReferenceArea x1={xMin} x2={xMedian} y1={0} y2={yMax} fill="#f1f5f9" fillOpacity={0.45} />
            <ReferenceArea x1={xMedian} x2={xMax} y1={0} y2={yMax} fill="#dcfce7" fillOpacity={0.35} />
          </>
        )}
        {yMin < 0 && (
          <>
            <ReferenceArea x1={xMin} x2={xMedian} y1={yMin} y2={0} fill="#fee2e2" fillOpacity={0.32} />
            <ReferenceArea x1={xMedian} x2={xMax} y1={yMin} y2={0} fill="#ffedd5" fillOpacity={0.28} />
          </>
        )}
        <ReferenceLine y={0} {...CHART_THEME.referenceLine} />
        <ReferenceLine
          x={xMedian}
          stroke="#94a3b8"
          strokeDasharray="4 4"
          label={{
            value: isZh ? `调价中位数 ${xMedian.toFixed(0)}` : `Median pricing ${xMedian.toFixed(0)}`,
            fill: "#64748b",
            fontSize: 11,
            position: "insideTopRight",
          }}
        />
        <ReferenceLine
          y={yMedian}
          stroke="#cbd5e1"
          strokeDasharray="2 4"
          label={{
            value: isZh ? `净现金中位数 ${formatYen(yMedian)}` : `Median net cash ${formatYen(yMedian)}`,
            fill: "#64748b",
            fontSize: 11,
            position: "insideLeft",
          }}
        />
        <Scatter data={data} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} fillOpacity={0.7} stroke={entry.color} strokeWidth={1} />
          ))}
        </Scatter>
        {labelledData.map((d, i) => (
          <ReferenceLine
            key={i}
            x={d.setPriceCalls}
            y={d.netProfit}
            ifOverflow="extendDomain"
            label={<CustomLabel value={d.displayName} dy={i % 2 === 0 ? -10 : 12} />}
            stroke="transparent"
          />
        ))}
      </RechartsScatterChart>
    </ResponsiveContainer>
  );
}
