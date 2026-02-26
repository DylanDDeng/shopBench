"use client";

import { SectionHeader } from "@/components/SectionHeader";
import { StrategyGroup } from "@/components/StrategyGroup";
import { PriceVsProfitScatter } from "@/components/ScatterChart";

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
  return (
    <>
      <SectionHeader title="Price Changes vs Net Profit" subtitle="bubble size = total revenue" />
      <div className="card">
        <PriceVsProfitScatter data={scatterData} height={400} />
      </div>

      <SectionHeader title="Strategy Groups" subtitle="click to expand" />
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
    </>
  );
}
