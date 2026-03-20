import type { DayData } from "@/lib/types";
import { formatYen } from "@/lib/types";
import { DayContextPanel, type ReplayDaySummary } from "@/components/DayContextPanel";
import { ToolCallCard } from "@/components/ToolCallCard";
import type { Locale } from "@/lib/i18n";

interface ReplayViewProps {
  daySummaries: ReplayDaySummary[];
  selectedDay: DayData | null;
  selectedDayIndex: number;
  basePath: string;
  locale?: Locale;
}

const REPLAY_VIEW_TEXT: Record<Locale, {
  noData: string;
  day: string;
  morningBrief: string;
  toolCalls: string;
  calls: string;
  errors: string;
  daySettlement: string;
  customers: string;
  revenue: string;
  expenses: string;
  netProfit: string;
  itemsSold: string;
  product: string;
  qty: string;
  expired: string;
}> = {
  en: {
    noData: "No data available",
    day: "Day",
    morningBrief: "Morning Brief",
    toolCalls: "Tool Calls",
    calls: "calls",
    errors: "errors",
    daySettlement: "Day Settlement",
    customers: "Customers",
    revenue: "Revenue",
    expenses: "Expenses",
    netProfit: "Net Profit",
    itemsSold: "Items sold",
    product: "Product",
    qty: "Qty",
    expired: "Expired",
  },
  zh: {
    noData: "暂无可用数据",
    day: "第",
    morningBrief: "晨间简报",
    toolCalls: "工具调用",
    calls: "次调用",
    errors: "个错误",
    daySettlement: "当日结算",
    customers: "顾客数",
    revenue: "收入",
    expenses: "支出",
    netProfit: "净利润",
    itemsSold: "售出商品",
    product: "商品",
    qty: "数量",
    expired: "过期",
  },
};

export function ReplayView({ daySummaries, selectedDay, selectedDayIndex, basePath, locale = "en" }: ReplayViewProps) {
  const text = REPLAY_VIEW_TEXT[locale];
  const summary = daySummaries[selectedDayIndex];

  if (!selectedDay || !summary) {
    return <div className="card"><p>{text.noData}</p></div>;
  }

  const errors = selectedDay.toolCalls.filter((tc) => {
    return typeof tc.result === "object" && tc.result !== null && "error" in (tc.result as Record<string, unknown>);
  });
  const cashTrend = daySummaries.slice(0, selectedDayIndex + 1).map((day) => ({ day: day.day, cash: day.cash }));

  return (
    <div>
      <div className="day-strip">
        {daySummaries.map((day, i) => (
          <a
            key={day.day}
            className={`day-btn ${i === selectedDayIndex ? "active" : ""}`}
            href={`${basePath}?day=${day.day}`}
          >
            {day.day}
          </a>
        ))}
      </div>

      <div className="replay-layout">
        <div className="replay-main">
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <h3 style={{ margin: 0 }}>{text.morningBrief}</h3>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                {locale === "zh" ? `第${selectedDay.day}天` : `Day ${selectedDay.day}`}
              </span>
            </div>
            <pre style={{
              whiteSpace: "pre-wrap",
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.6,
              fontFamily: "var(--font-mono)",
            }}>
              {selectedDay.morningBrief}
            </pre>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <h3 style={{ margin: 0 }}>{text.toolCalls}</h3>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                {locale === "zh" ? `${selectedDay.toolCalls.length}${text.calls}` : `${selectedDay.toolCalls.length} ${text.calls}`}
                {errors.length > 0 && (
                  <span style={{ color: "var(--accent-red)", marginLeft: "0.5rem" }}>
                    {locale === "zh"
                      ? `（${errors.length}${text.errors}）`
                      : `(${errors.length} error${errors.length !== 1 ? "s" : ""})`}
                  </span>
                )}
              </span>
            </div>
            {selectedDay.toolCalls.map((tc, i) => (
              <ToolCallCard key={i} call={tc} index={i} locale={locale} />
            ))}
          </div>

          <div className="card" style={{ borderLeft: "3px solid var(--accent-green)" }}>
            <h3 style={{ margin: "0 0 0.75rem", color: "var(--accent-green)" }}>{text.daySettlement}</h3>
            <div className="grid-4">
              <div>
                <div className="metric-label">{text.customers}</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{selectedDay.settlement.customerCount}</div>
              </div>
              <div>
                <div className="metric-label">{text.revenue}</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--accent-blue)" }}>
                  {formatYen(selectedDay.settlement.revenue)}
                </div>
              </div>
              <div>
                <div className="metric-label">{text.expenses}</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                  {formatYen(selectedDay.settlement.expenses)}
                </div>
              </div>
              <div>
                <div className="metric-label">{text.netProfit}</div>
                <div style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: selectedDay.settlement.netProfit >= 0 ? "var(--accent-green)" : "var(--accent-red)",
                }}>
                  {formatYen(selectedDay.settlement.netProfit)}
                </div>
              </div>
            </div>

            {selectedDay.settlement.itemsSold.length > 0 && (
              <details style={{ marginTop: "1rem" }}>
                <summary style={{ cursor: "pointer", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  {text.itemsSold} ({selectedDay.settlement.itemsSold.length})
                </summary>
                <table style={{ marginTop: "0.5rem" }}>
                  <thead>
                    <tr>
                      <th>{text.product}</th>
                      <th className="text-right">{text.qty}</th>
                      <th className="text-right">{text.revenue}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDay.settlement.itemsSold.map((item, i) => (
                      <tr key={i}>
                        <td>{item.productId}</td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">{formatYen(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}

            {selectedDay.settlement.expiredItems.length > 0 && (
              <div style={{ marginTop: "0.75rem", padding: "0.5rem", background: "rgba(239, 68, 68, 0.05)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--accent-red)" }}>
                  {text.expired}: {selectedDay.settlement.expiredItems.map((e) => `${e.productId} (${e.quantity})`).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        <DayContextPanel day={summary} cashTrend={cashTrend} locale={locale} />
      </div>
    </div>
  );
}
