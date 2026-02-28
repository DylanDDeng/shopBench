"use client";

import { LineChart, Line, ResponsiveContainer, ReferenceLine, XAxis, YAxis, Tooltip } from "recharts";
import type { DayData } from "@/lib/types";
import { formatYen } from "@/lib/types";
import { CHART_THEME } from "@/lib/chartConfig";
import type { Locale } from "@/lib/i18n";

interface DayContextPanelProps {
  days: DayData[];
  currentDay: number;
  locale?: Locale;
}

const CONTEXT_TEXT: Record<Locale, {
  snapshot: string;
  cash: string;
  satisfaction: string;
  reputation: string;
  employees: string;
  inventory: string;
  units: string;
  weather: string;
  revenue: string;
  dayProfit: string;
  customers: string;
  cashTrend: string;
  start: string;
}> = {
  en: {
    snapshot: "Snapshot",
    cash: "Cash",
    satisfaction: "Satisfaction",
    reputation: "Reputation",
    employees: "Employees",
    inventory: "Inventory",
    units: "units",
    weather: "Weather",
    revenue: "Revenue",
    dayProfit: "Day Profit",
    customers: "Customers",
    cashTrend: "Cash Trend",
    start: "Start",
  },
  zh: {
    snapshot: "状态快照",
    cash: "现金",
    satisfaction: "满意度",
    reputation: "声誉",
    employees: "员工数",
    inventory: "库存",
    units: "件",
    weather: "天气",
    revenue: "收入",
    dayProfit: "当日利润",
    customers: "顾客数",
    cashTrend: "现金趋势",
    start: "起始值",
  },
};

export function DayContextPanel({ days, currentDay, locale = "en" }: DayContextPanelProps) {
  const day = days[currentDay];
  if (!day) return null;
  const text = CONTEXT_TEXT[locale];

  const ss = day.stateSnapshot;
  const cashData = days.slice(0, currentDay + 1).map(d => ({
    day: d.day,
    cash: d.stateSnapshot?.cash ?? 0,
  }));

  const invValue = ss?.inventory?.reduce((s, it) => s + it.quantity * it.costPerUnit, 0) ?? 0;
  const invCount = ss?.inventory?.reduce((s, it) => s + it.quantity, 0) ?? 0;

  return (
    <div className="replay-sidebar">
      <div className="context-panel" style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 0.75rem" }}>
          {locale === "zh" ? `第${day.day}天${text.snapshot}` : `Day ${day.day} ${text.snapshot}`}
        </h3>
        <div className="context-stat">
          <span className="context-stat-label">{text.cash}</span>
          <span className="context-stat-value" style={{ color: "var(--accent-amber)" }}>
            {formatYen(ss?.cash ?? 0)}
          </span>
        </div>
        <div className="context-stat">
          <span className="context-stat-label">{text.satisfaction}</span>
          <span className="context-stat-value">{ss?.customerSatisfaction ?? "–"}</span>
        </div>
        <div className="context-stat">
          <span className="context-stat-label">{text.reputation}</span>
          <span className="context-stat-value">{ss?.reputation ?? "–"}</span>
        </div>
        <div className="context-stat">
          <span className="context-stat-label">{text.employees}</span>
          <span className="context-stat-value">{ss?.employees?.length ?? 0}</span>
        </div>
        <div className="context-stat">
          <span className="context-stat-label">{text.inventory}</span>
          <span className="context-stat-value">{invCount} {text.units} ({formatYen(invValue)})</span>
        </div>
        <div className="context-stat">
          <span className="context-stat-label">{text.weather}</span>
          <span className="context-stat-value">{ss?.weather ?? "–"}</span>
        </div>
        <div className="context-stat">
          <span className="context-stat-label">{text.revenue}</span>
          <span className="context-stat-value" style={{ color: "var(--accent-blue)" }}>
            {formatYen(day.settlement.revenue)}
          </span>
        </div>
        <div className="context-stat">
          <span className="context-stat-label">{text.dayProfit}</span>
          <span className="context-stat-value" style={{ color: day.settlement.netProfit >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
            {formatYen(day.settlement.netProfit)}
          </span>
        </div>
        <div className="context-stat">
          <span className="context-stat-label">{text.customers}</span>
          <span className="context-stat-value">{day.settlement.customerCount}</span>
        </div>
      </div>

      <div className="context-panel">
        <h3 style={{ margin: "0 0 0.5rem" }}>{text.cashTrend}</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={cashData}>
            <XAxis dataKey="day" {...CHART_THEME.axis} />
            <YAxis {...CHART_THEME.axis} />
            <Tooltip {...CHART_THEME.tooltip} />
            <ReferenceLine y={20000} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: text.start, fill: "#64748b", fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="cash"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
