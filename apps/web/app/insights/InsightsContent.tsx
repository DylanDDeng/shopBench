"use client";

import { StrategyGroup } from "@/components/StrategyGroup";
import { PriceVsProfitScatter } from "@/components/ScatterChart";
import { formatYen } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

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
  locale?: Locale;
}

export function InsightsContent({ scatterData, strategyGroups, locale = "en" }: InsightsContentProps) {
  const isZh = locale === "zh";
  const topNetCash = [...scatterData].sort((a, b) => b.netProfit - a.netProfit)[0];
  const topRevenue = [...scatterData].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  const mostPriceChanges = [...scatterData].sort((a, b) => b.setPriceCalls - a.setPriceCalls)[0];
  const strongestStrategy = [...strategyGroups].sort((a, b) => b.avgNetProfit - a.avgNetProfit)[0];
  const largestStrategy = [...strategyGroups].sort((a, b) => b.models.length - a.models.length)[0];

  return (
    <>
      <section className="insights-panel">
        <div className="insights-block-head">
          <h2>{isZh ? "调价次数 vs 净利润" : "Price Changes vs Net Profit"}</h2>
          <span className="insights-block-subtitle">{isZh ? "气泡大小 = 总收入" : "bubble size = total revenue"}</span>
        </div>
        <div className="insights-chip-row">
          {topNetCash ? (
            <div className="insights-chip">
              <span>{isZh ? "净现金最高" : "Top Net Cash"}</span>
              <strong>{topNetCash.displayName} ({formatYen(topNetCash.netProfit)})</strong>
            </div>
          ) : null}
          {topRevenue ? (
            <div className="insights-chip">
              <span>{isZh ? "收入最高" : "Top Revenue"}</span>
              <strong>{topRevenue.displayName} ({formatYen(topRevenue.totalRevenue)})</strong>
            </div>
          ) : null}
          {mostPriceChanges ? (
            <div className="insights-chip">
              <span>{isZh ? "调价最频繁" : "Most Price Changes"}</span>
              <strong>{mostPriceChanges.displayName} ({mostPriceChanges.setPriceCalls})</strong>
            </div>
          ) : null}
        </div>
        <div className="insights-chart-shell">
          <PriceVsProfitScatter data={scatterData} height={400} locale={locale} />
        </div>
      </section>

      <section className="insights-panel">
        <div className="insights-block-head">
          <h2>{isZh ? "策略分组" : "Strategy Groups"}</h2>
          <span className="insights-block-subtitle">{isZh ? "点击展开详情" : "click to expand"}</span>
        </div>
        <div className="insights-chip-row">
          {strongestStrategy ? (
            <div className="insights-chip">
              <span>{isZh ? "平均净现金最高" : "Highest Avg Net Cash"}</span>
              <strong>{strongestStrategy.title} ({formatYen(strongestStrategy.avgNetProfit)})</strong>
            </div>
          ) : null}
          {largestStrategy ? (
            <div className="insights-chip">
              <span>{isZh ? "最大策略簇" : "Largest Cluster"}</span>
              <strong>{largestStrategy.title} ({largestStrategy.models.length}{isZh ? " 个模型" : " models"})</strong>
            </div>
          ) : null}
          <div className="insights-chip">
            <span>{isZh ? "策略家族数" : "Strategy Families"}</span>
            <strong>{strategyGroups.length}{isZh ? " 个已识别分组" : " detected groups"}</strong>
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
              locale={locale}
            />
          ))}
        </div>
      </section>
    </>
  );
}
