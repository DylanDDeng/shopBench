"use client";

import { useState } from "react";
import type { ToolCall } from "@/lib/types";
import { getToolCategory, getToolLabel } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface ToolCallCardProps {
  call: ToolCall;
  index: number;
  locale?: Locale;
}

const TOOL_LABELS_ZH: Record<string, string> = {
  check_inventory: "查看库存",
  view_financials: "查看财务",
  view_sales_history: "查看销售历史",
  view_suppliers: "查看供应商",
  view_pending_orders: "查看待处理订单",
  view_employee_status: "查看员工状态",
  view_customer_feedback: "查看顾客反馈",
  view_competitors: "查看竞争对手",
  check_market_trends: "查看市场趋势",
  check_weather_forecast: "查看天气预报",
  estimate_order: "估算订单",
  purchase_goods: "采购商品",
  set_price: "设置价格",
  dispose_goods: "处理商品",
  adjust_store_hours: "调整营业时间",
  hire_employee: "招聘员工",
  fire_employee: "解雇员工",
  assign_shift: "安排班次",
  run_promotion: "执行促销",
  launch_marketing: "投放营销",
  negotiate_supplier: "供应商议价",
};

const CATEGORY_TEXT_ZH: Record<string, string> = {
  info: "信息",
  operation: "运营",
  personnel: "人事",
  strategy: "策略",
};

export function ToolCallCard({ call, index, locale = "en" }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const category = getToolCategory(call.name);
  const baseLabel = getToolLabel(call.name);
  const label = locale === "zh" ? (TOOL_LABELS_ZH[call.name] ?? baseLabel) : baseLabel;
  const isError = typeof call.result === "object" && call.result !== null && "error" in (call.result as Record<string, unknown>);
  const categoryLabel = locale === "zh" ? (CATEGORY_TEXT_ZH[category] ?? category) : category;

  const args = Object.keys(call.arguments).length > 0
    ? JSON.stringify(call.arguments, null, 2)
    : null;

  return (
    <div
      className={`tool-call-card tool-${category} ${isError ? "error" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="tool-call-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontVariantNumeric: "tabular-nums" }}>
            #{index + 1}
          </span>
          <span className="tool-call-name">{label}</span>
          <span className={`badge tool-badge-${category}`} style={{ fontSize: "0.6875rem" }}>
            {categoryLabel}
          </span>
        </div>
        <span style={{ fontSize: "0.75rem" }}>
          {isError ? (
            <span style={{ color: "var(--accent-red)" }}>{locale === "zh" ? "错误" : "Error"}</span>
          ) : (
            <span style={{ color: "var(--accent-green)" }}>{locale === "zh" ? "正常" : "OK"}</span>
          )}
        </span>
      </div>

      {expanded && (
        <>
          {args && <div className="tool-call-args">{args}</div>}
          <div className="tool-call-result">
            {JSON.stringify(call.result, null, 2)}
          </div>
        </>
      )}
    </div>
  );
}
