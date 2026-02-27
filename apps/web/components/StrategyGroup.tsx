"use client";

import { useState, type CSSProperties } from "react";
import { formatYen } from "@/lib/types";

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
}

export function StrategyGroup({
  color,
  emoji,
  title,
  models,
  summary,
  avgNetProfit,
  defaultOpen = false,
}: StrategyGroupProps) {
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
            <span className="strategy-count">{models.length} models</span>
          </div>
          <span className="strategy-models-preview">{previewModels}</span>
        </div>
        <div className="strategy-header-right">
          <span className={`strategy-avg-chip ${avgNetProfit >= 0 ? "positive" : "negative"}`}>
            Avg Net Cash {formatYen(avgNetProfit)}
          </span>
          <span className="strategy-chevron">{open ? "▴" : "▾"}</span>
        </div>
      </button>

      <div className={`strategy-body ${open ? "expanded" : "collapsed"}`}>
        <p className="strategy-summary">{summary}</p>
        <table className="strategy-table">
          <thead>
            <tr>
              <th>Model</th>
              <th className="text-right">Net Profit</th>
              <th className="text-right">Price Changes</th>
              <th className="text-right">Purchases</th>
              <th className="text-right">Revenue</th>
              <th className="text-right">Zero-Rev Days</th>
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
