"use client";

import { useState, type CSSProperties } from "react";
import { formatYen } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface StrategyModelData {
  displayName: string;
  netProfit: number;
  setPriceCalls: number;
  purchaseCalls: number;
  totalRevenue: number;
  zeroRevenueDays: number;
}

interface StrategyGroupProps {
  color: string;
  emoji: string;
  title: string;
  models: StrategyModelData[];
  summary: string;
  avgNetProfit: number;
  defaultOpen?: boolean;
  locale?: Locale;
}

export function StrategyGroup({
  color,
  emoji,
  title,
  models,
  summary,
  avgNetProfit,
  defaultOpen = false,
  locale = "en",
}: StrategyGroupProps) {
  const isZh = locale === "zh";
  const [open, setOpen] = useState(defaultOpen);
  const previewModels = models.map(m => m.displayName).join(", ");
  const rootStyle = { "--strategy-accent": color } as CSSProperties;

  return (
    <div className="strategy-group" style={rootStyle}>
      <button className="strategy-header" onClick={() => setOpen(!open)}>
        <div className="strategy-title">
          <div className="strategy-title-row">
            <span className="strategy-emoji">{emoji}</span>
            <span className="strategy-name">{title}</span>
            <span className="strategy-count">{models.length}{isZh ? " 个模型" : " models"}</span>
          </div>
          <span className="strategy-models-preview">{previewModels}</span>
        </div>
        <div className="strategy-header-right">
          <span className={`strategy-avg-chip ${avgNetProfit >= 0 ? "positive" : "negative"}`}>
            {isZh ? "平均净现金" : "Avg Net Cash"} {formatYen(avgNetProfit)}
          </span>
          <span className="strategy-chevron">{open ? "▴" : "▾"}</span>
        </div>
      </button>

      <div className={`strategy-body ${open ? "expanded" : "collapsed"}`}>
        <p className="strategy-summary">{summary}</p>
        <table className="strategy-table">
          <thead>
            <tr>
              <th>{isZh ? "模型" : "Model"}</th>
              <th className="text-right">{isZh ? "净利润" : "Net Profit"}</th>
              <th className="text-right">{isZh ? "调价次数" : "Price Changes"}</th>
              <th className="text-right">{isZh ? "采购次数" : "Purchases"}</th>
              <th className="text-right">{isZh ? "收入" : "Revenue"}</th>
              <th className="text-right">{isZh ? "零收入天数" : "Zero-Rev Days"}</th>
            </tr>
          </thead>
          <tbody>
            {models.map(m => (
              <tr key={m.displayName}>
                <td>{m.displayName}</td>
                <td className={`text-right ${m.netProfit >= 0 ? "profit-positive" : "profit-negative"}`}>
                  {formatYen(m.netProfit)}
                </td>
                <td className="text-right">{m.setPriceCalls}</td>
                <td className="text-right">{m.purchaseCalls}</td>
                <td className="text-right">{formatYen(m.totalRevenue)}</td>
                <td className="text-right">{m.zeroRevenueDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
