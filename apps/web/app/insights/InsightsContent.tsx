"use client";

import { StrategyGroup } from "@/components/StrategyGroup";
import { PriceVsProfitScatter } from "@/components/ScatterChart";
import { formatYen } from "@/lib/types";

interface ScatterDataPoint {
  displayName: string;
  setPriceCalls: number;
  netProfit: number;
  totalRevenue: number;
  color: string;
}

interface StrategyModelData {
  displayName: string;
  netProfit: number;
  setPriceCalls: number;
  purchaseCalls: number;
  totalRevenue: number;
  zeroRevenueDays: number;
}

interface StrategyGroupData {
  type: string;
  color: string;
  emoji: string;
  title: string;
  models: StrategyModelData[];
  summary: string;
  avgNetProfit: number;
}

interface InsightsContentProps {
  scatterData: ScatterDataPoint[];
  strategyGroups: StrategyGroupData[];
}

export function InsightsContent({ scatterData, strategyGroups }: InsightsContentProps) {
  const topNetCash = [...scatterData].sort((a, b) => b.netProfit - a.netProfit)[0];
  const topRevenue = [...scatterData].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  const mostPriceChanges = [...scatterData].sort((a, b) => b.setPriceCalls - a.setPriceCalls)[0];
  const strongestStrategy = [...strategyGroups].sort((a, b) => b.avgNetProfit - a.avgNetProfit)[0];
  const largestStrategy = [...strategyGroups].sort((a, b) => b.models.length - a.models.length)[0];

  return (
    <>
      <section className="insights-panel">
        <div className="insights-block-head">
          <h2>Price Changes vs Net Profit</h2>
          <span className="insights-block-subtitle">bubble size = total revenue</span>
        </div>
        <div className="insights-chip-row">
          {topNetCash ? (
            <div className="insights-chip">
              <span>Top Net Cash</span>
              <strong>{topNetCash.displayName} ({formatYen(topNetCash.netProfit)})</strong>
            </div>
          ) : null}
          {topRevenue ? (
            <div className="insights-chip">
              <span>Top Revenue</span>
              <strong>{topRevenue.displayName} ({formatYen(topRevenue.totalRevenue)})</strong>
            </div>
          ) : null}
          {mostPriceChanges ? (
            <div className="insights-chip">
              <span>Most Price Changes</span>
              <strong>{mostPriceChanges.displayName} ({mostPriceChanges.setPriceCalls})</strong>
            </div>
          ) : null}
        </div>
        <div className="insights-chart-shell">
          <PriceVsProfitScatter data={scatterData} height={400} />
        </div>
      </section>

      <section className="insights-panel">
        <div className="insights-block-head">
          <h2>Strategy Groups</h2>
          <span className="insights-block-subtitle">click to expand</span>
        </div>
        <div className="insights-chip-row">
          {strongestStrategy ? (
            <div className="insights-chip">
              <span>Highest Avg Net Cash</span>
              <strong>{strongestStrategy.title} ({formatYen(strongestStrategy.avgNetProfit)})</strong>
            </div>
          ) : null}
          {largestStrategy ? (
            <div className="insights-chip">
              <span>Largest Cluster</span>
              <strong>{largestStrategy.title} ({largestStrategy.models.length} models)</strong>
            </div>
          ) : null}
          <div className="insights-chip">
            <span>Strategy Families</span>
            <strong>{strategyGroups.length} detected groups</strong>
          </div>
        </div>
        <div className="strategy-group-stack">
          {strategyGroups.map(g => (
            <StrategyGroup
              key={g.type}
              color={g.color}
              emoji={g.emoji}
              title={g.title}
              models={g.models}
              summary={g.summary}
              avgNetProfit={g.avgNetProfit}
              defaultOpen={g.type === "aggressive"}
            />
          ))}
        </div>
      </section>
    </>
  );
}
