"use client";

import { useState } from "react";
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
    <div style={{ ...CHART_THEME.tooltip.contentStyle, minWidth: 180 }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#0f172a" }}>{d.displayName}</div>
      <div style={{ color: "#334155", fontSize: 12 }}>
        {isZh ? "调价" : "Pricing"}: {d.setPriceCalls} · {isZh ? "净现金" : "Net Cash"}: {formatYen(d.netProfit)}
      </div>
      <div style={{ color: "#64748b", fontSize: 12 }}>
        {isZh ? "收入" : "Revenue"}: {formatYen(d.totalRevenue)}
      </div>
    </div>
  );
}

export function PriceVsProfitScatter({ data, height = 400, locale = "en" }: ScatterChartProps) {
  const isZh = locale === "zh";
  if (data.length === 0) return null;
  const [activeName, setActiveName] = useState<string | null>(null);

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

  const legendData = [...data].sort((a, b) => b.netProfit - a.netProfit);
  const revenueRange = [
    Math.min(...revenueValues),
    Math.max(...revenueValues),
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 230px", gap: 12, alignItems: "stretch" }}>
      <div style={{ minWidth: 0, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsScatterChart margin={{ top: 26, right: 16, bottom: 24, left: 44 }}>
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
            <Scatter
              data={data}
              isAnimationActive={false}
              onMouseEnter={(point: any) => setActiveName(point?.displayName ?? point?.payload?.displayName ?? null)}
              onMouseLeave={() => setActiveName(null)}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color}
                  fillOpacity={activeName ? (activeName === entry.displayName ? 0.92 : 0.18) : 0.64}
                  stroke={activeName === entry.displayName ? "#0f172a" : "#ffffff"}
                  strokeWidth={activeName === entry.displayName ? 2.4 : 1.2}
                />
              ))}
            </Scatter>
          </RechartsScatterChart>
        </ResponsiveContainer>
      </div>
      <aside
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 10,
          padding: "10px 10px 8px",
          background: "linear-gradient(180deg, rgba(248, 251, 255, 0.96) 0%, rgba(255,255,255,0.95) 100%)",
          overflow: "auto",
        }}
      >
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>
          {isZh ? "模型图例（按净现金）" : "Model Legend (by net cash)"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {legendData.map((entry, idx) => {
            const isActive = activeName === entry.displayName;
            return (
              <button
                key={entry.displayName + idx}
                type="button"
                onMouseEnter={() => setActiveName(entry.displayName)}
                onMouseLeave={() => setActiveName(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  border: "none",
                  borderRadius: 8,
                  background: isActive ? "rgba(59,130,246,0.12)" : "transparent",
                  padding: "5px 6px",
                  cursor: "default",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: entry.color,
                    flex: "0 0 auto",
                    boxShadow: "0 0 0 1px #ffffff, 0 0 0 2px rgba(148,163,184,0.35)",
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    lineHeight: 1.25,
                    color: isActive ? "#0f172a" : "#334155",
                    fontWeight: isActive ? 700 : 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={`${entry.displayName} · ${isZh ? "净现金" : "Net Cash"} ${formatYen(entry.netProfit)}`}
                >
                  {entry.displayName}
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
