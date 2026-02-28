"use client";

import { StrategyGroup } from "@/components/StrategyGroup";
import { PriceVsProfitScatter } from "@/components/ScatterChart";
import { HorizontalBarChart } from "@/components/HorizontalBarChart";
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

interface CashConversionDataPoint {
  name: string;
  value: number;
  color: string;
}

interface CashGapDataPoint {
  name: string;
  value: number;
  color: string;
}

interface InsightsContentProps {
  scatterData: ScatterDataPoint[];
  strategyGroups: StrategyGroupData[];
  cashConversionData: CashConversionDataPoint[];
  cashGapData: CashGapDataPoint[];
  locale?: Locale;
}

export function InsightsContent({
  scatterData,
  strategyGroups,
  cashConversionData,
  cashGapData,
  locale = "en",
}: InsightsContentProps) {
  const isZh = locale === "zh";
  const topNetCash = [...scatterData].sort((a, b) => b.netProfit - a.netProfit)[0];
  const topRevenue = [...scatterData].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  const mostPriceChanges = [...scatterData].sort((a, b) => b.setPriceCalls - a.setPriceCalls)[0];
  const bestConversion = [...cashConversionData].sort((a, b) => b.value - a.value)[0];
  const strongestStrategy = [...strategyGroups].sort((a, b) => b.avgNetProfit - a.avgNetProfit)[0];
  const largestStrategy = [...strategyGroups].sort((a, b) => b.models.length - a.models.length)[0];

  return (
    <>
      <section className="insights-panel">
        <div className="insights-block-head">
          <h2>{isZh ? "调价次数 vs 净现金" : "Price Changes vs Net Cash"}</h2>
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
          <h2>{isZh ? "现金兑现能力" : "Cash Realization Efficiency"}</h2>
          <span className="insights-block-subtitle">
            {isZh ? "看账面净利润最终兑现成多少 30 天净现金" : "How much cumulative net profit is realized as 30-day net cash"}
          </span>
        </div>
        <div className="insights-chip-row">
          {bestConversion ? (
            <div className="insights-chip">
              <span>{isZh ? "现金转化效率最高" : "Best Cash Conversion"}</span>
              <strong>{bestConversion.name} ({bestConversion.value.toFixed(1)}%)</strong>
            </div>
          ) : null}
          <div className="insights-chip">
            <span>{isZh ? "口径" : "Formula"}</span>
            <strong>{isZh ? "30天净现金 / 累计每日净利润（仅累计净利润>0）" : "30-day net cash / cumulative daily net profit (only when cumulative net profit > 0)"}</strong>
          </div>
          <div className="insights-chip">
            <span>{isZh ? "提醒" : "Note"}</span>
            <strong>{isZh ? "累计净利润≤0 的模型不参与该比率排名" : "Models with cumulative net profit <= 0 are excluded from conversion ranking"}</strong>
          </div>
        </div>

        <div className="insights-dual-grid">
          <div className="insights-chart-shell insights-subchart">
            <h3>{isZh ? "模型现金转化效率（%）" : "Model Cash Conversion Efficiency (%)"}</h3>
            <p>
              {isZh
                ? "仅在“累计每日净利润>0”时参与计算。值越高，代表越能把账面利润兑现成最终现金。"
                : "Computed only for models with positive cumulative daily net profit. Higher means better cash realization."}
            </p>
            {cashConversionData.length > 0 ? (
              <HorizontalBarChart
                data={cashConversionData}
                height={Math.max(300, cashConversionData.length * 30)}
                xTickFormatter={(v: number) => `${v}%`}
                valueFormatter={(v: number) => `${v.toFixed(1)}%`}
              />
            ) : (
              <div style={{ color: "#64748b", fontSize: "0.9rem", padding: "0.6rem 0.2rem" }}>
                {isZh ? "当前没有满足“累计净利润>0”的模型，无法计算现金转化率。" : "No model has positive cumulative daily net profit, so conversion rate is unavailable."}
              </div>
            )}
          </div>

          <div className="insights-chart-shell insights-subchart">
            <h3>{isZh ? "现金缺口（30天净现金 - 累计净利润）" : "Cash Gap (30-day Net Cash - Cumulative Net Profit)"}</h3>
            <p>
              {isZh
                ? "缺口越负，说明“账面净利润”越难兑现为最终现金（常见原因是补货支出提前发生、现金回收慢等）。"
                : "More negative values mean accounting profit was less effectively converted to final cash (often due to front-loaded purchases and slower cash realization)."}
            </p>
            <HorizontalBarChart
              data={cashGapData}
              height={Math.max(300, cashGapData.length * 30)}
              xTickFormatter={(v: number) => formatYen(v)}
              valueFormatter={(v: number) => formatYen(v)}
            />
          </div>
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
