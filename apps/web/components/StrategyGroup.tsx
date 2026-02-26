"use client";

import { useState } from "react";
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

  return (
    <div className="strategy-group" style={{ borderLeftColor: color }}>
      <button className="strategy-header" onClick={() => setOpen(!open)}>
        <div className="strategy-title">
          <span className="strategy-emoji">{emoji}</span>
          <span className="strategy-name">{title}</span>
          <span className="strategy-models-preview">
            {models.map(m => m.displayName).join(", ")}
          </span>
        </div>
        <span className="strategy-chevron">{open ? "▴" : "▾"}</span>
      </button>

      <div className={`strategy-body ${open ? "expanded" : "collapsed"}`}>
        <p className="strategy-summary">{summary}</p>
        <div className="strategy-avg">
          Average Net Profit:{" "}
          <span className={avgNetProfit >= 0 ? "profit-positive" : "profit-negative"}>
            {formatYen(avgNetProfit)}
          </span>
        </div>
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
