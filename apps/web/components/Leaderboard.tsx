"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { SimulationResult, DerivedMetrics } from "@/lib/types";
import { formatYen, formatPct } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { SparklineCell } from "./SparklineCell";

interface LeaderboardProps {
  results: SimulationResult[];
  derivedMetrics: DerivedMetrics[];
  locale?: Locale;
}

interface MetricInfoProps {
  label: string;
  help: string;
  locale: Locale;
}

const LEADERBOARD_TEXT: Record<Locale, {
  rank: string;
  model: string;
  netCash: string;
  netCashHelp: string;
  grossMargin: string;
  grossMarginHelp: string;
  errorRate: string;
  errorRateHelp: string;
  profit: string;
  profitHelp: string;
  actions: string;
  view: string;
  report: string;
  replay: string;
  metricGuideTitle: string;
  metricGuideIntro: string;
  metricGuideNetCash: string;
  metricGuideNetProfit: string;
  metricGuideGrossProfit: string;
  metricGuideGrossMargin: string;
  metricGuideInventoryNote: string;
}> = {
  en: {
    rank: "Rank",
    model: "Model",
    netCash: "30-Day Net Cash (¥)",
    netCashHelp: "Final cash minus starting cash minus outstanding loans; this is the ranking metric.",
    grossMargin: "Gross Margin",
    grossMarginHelp: "(Revenue - COGS) / Revenue for sold items.",
    errorRate: "Tool Call Error Rate",
    errorRateHelp: "Percentage of tool calls that returned an error.",
    profit: "30-Day Profit",
    profitHelp: "Cumulative trend of daily net profit across the 30-day run.",
    actions: "Actions",
    view: "View",
    report: "Report",
    replay: "Replay",
    metricGuideTitle: "Metric definitions (important)",
    metricGuideIntro: "ShopBench ranking is based on 30-Day Net Cash. Do not treat gross margin as the final score.",
    metricGuideNetCash: "30-Day Net Cash = final cash - starting cash - outstanding loans (this is the ranking metric).",
    metricGuideNetProfit: "Daily Net Profit = revenue - COGS - wages - rent - loan interest - marketing spend - other expenses.",
    metricGuideGrossProfit: "Daily Gross Profit = revenue - COGS of sold items; it excludes wages/rent/marketing and cash timing effects.",
    metricGuideGrossMargin: "Gross Margin is a ratio, not absolute cash generated.",
    metricGuideInventoryNote: "End-of-run inventory is not included in final score in this 30-day setup.",
  },
  zh: {
    rank: "排名",
    model: "模型",
    netCash: "30天净现金 (¥)",
    netCashHelp: "期末现金减去初始现金和未偿贷款；该指标用于最终排名。",
    grossMargin: "毛利率",
    grossMarginHelp: "已售商品的 (收入 - 成本) / 收入。",
    errorRate: "工具调用错误率",
    errorRateHelp: "所有工具调用中返回错误的比例。",
    profit: "30天利润趋势",
    profitHelp: "30天累计日净利润的变化曲线。",
    actions: "操作",
    view: "查看",
    report: "报告",
    replay: "回放",
    metricGuideTitle: "指标口径说明（重要）",
    metricGuideIntro: "ShopBench 排名依据是「30天净现金」，不要把毛利率当成最终得分。",
    metricGuideNetCash: "30天净现金 = 期末现金 - 初始现金 - 未偿贷款（该指标用于排名）。",
    metricGuideNetProfit: "每日净利润 = 收入 - 销售成本 - 人工 - 房租 - 贷款利息 - 营销支出 - 其他费用。",
    metricGuideGrossProfit: "每日毛利润 = 收入 - 已售商品成本；不含人工/房租/营销等费用，也不反映现金时点。",
    metricGuideGrossMargin: "毛利率是比例指标，不等于实际回笼现金规模。",
    metricGuideInventoryNote: "在当前 30 天评测中，期末库存不计入最终得分。",
  },
};

function MetricInfo({ label, help, locale }: MetricInfoProps) {
  return (
    <span className="metric-info-label">
      <span>{label}</span>
      <span className="metric-info-wrap">
        <button
          type="button"
          className="metric-info-btn"
          aria-label={locale === "zh" ? `${label} 指标说明` : `${label} definition`}
        >
          i
        </button>
        <span className="metric-info-tooltip" role="tooltip">
          {help}
        </span>
      </span>
    </span>
  );
}

function getRankBadge(rank: number, locale: Locale) {
  if (locale === "zh") {
    if (rank === 0) return <span className="badge badge-gold">1</span>;
    if (rank === 1) return <span className="badge badge-silver">2</span>;
    if (rank === 2) return <span className="badge badge-bronze">3</span>;
  }
  if (rank === 0) return <span className="badge badge-gold">1st</span>;
  if (rank === 1) return <span className="badge badge-silver">2nd</span>;
  if (rank === 2) return <span className="badge badge-bronze">3rd</span>;
  return <span className="badge-rank">{rank + 1}</span>;
}

function ModelNameMarquee({ name }: { name: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const text = textRef.current;
      if (!container || !text) return;

      const overflowDistance = Math.max(0, text.scrollWidth - container.clientWidth);
      setOverflow(overflowDistance > 4);
      setDistance(overflowDistance + 12);
    };

    measure();

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(measure)
      : null;

    if (resizeObserver) {
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      if (textRef.current) resizeObserver.observe(textRef.current);
    }

    window.addEventListener("resize", measure);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [name]);

  const durationSeconds = Math.max(4, distance / 36);

  return (
    <div
      ref={containerRef}
      className={`model-marquee ${overflow ? "is-overflow" : ""}`}
      title={name}
      style={
        {
          "--marquee-distance": `${distance}px`,
          "--marquee-duration": `${durationSeconds}s`,
        } as CSSProperties
      }
    >
      <span ref={textRef}>{name}</span>
    </div>
  );
}

function getModelLogo(model: string): string | null {
  const key = model.toLowerCase();
  if (key.includes("claude")) return "/leaderboard/claude-color.svg";
  if (key.includes("stepfun") || key.includes("step-")) return "/leaderboard/stepfun-color.svg";
  if (key.includes("gemini")) return "/leaderboard/gemini-color.svg";
  if (key.includes("deepseek")) return "/leaderboard/deepseek-color.svg";
  if (key.includes("minimax")) return "/leaderboard/minimax-color.svg";
  if (key.includes("glm") || key.includes("zai")) return "/leaderboard/zai.svg";
  if (key.includes("qwen")) return "/leaderboard/qwen-color.svg";
  if (key.includes("gpt") || key.includes("openai")) return "/leaderboard/openai.svg";
  if (key.includes("grok")) return "/leaderboard/grok.svg";
  if (key.includes("kimi") || key.includes("k2.5")) return "/leaderboard/kimi.svg";
  return null;
}

export function Leaderboard({ results, derivedMetrics, locale = "en" }: LeaderboardProps) {
  const text = LEADERBOARD_TEXT[locale];
  const routePrefix = `/${locale}`;

  return (
    <div className="card leaderboard-table">
      <details className="metrics-guide">
        <summary>{text.metricGuideTitle}</summary>
        <p className="metrics-guide-intro">{text.metricGuideIntro}</p>
        <ul className="metrics-guide-list">
          <li>{text.metricGuideNetCash}</li>
          <li>{text.metricGuideNetProfit}</li>
          <li>{text.metricGuideGrossProfit}</li>
          <li>{text.metricGuideGrossMargin}</li>
          <li>{text.metricGuideInventoryNote}</li>
        </ul>
      </details>
      <table>
        <thead>
          <tr>
            <th style={{ width: 60 }}>{text.rank}</th>
            <th className="model-col">{text.model}</th>
            <th className="text-center">
              <MetricInfo
                label={text.netCash}
                help={text.netCashHelp}
                locale={locale}
              />
            </th>
            <th className="text-center">
              <MetricInfo
                label={text.grossMargin}
                help={text.grossMarginHelp}
                locale={locale}
              />
            </th>
            <th className="text-center">
              <MetricInfo
                label={text.errorRate}
                help={text.errorRateHelp}
                locale={locale}
              />
            </th>
            <th>
              <MetricInfo
                label={text.profit}
                help={text.profitHelp}
                locale={locale}
              />
            </th>
            <th className="text-center">{text.actions}</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => {
            const dm = derivedMetrics[i];
            const shortModelName = r.model.split("/").pop() ?? r.model;
            const logoSrc = getModelLogo(r.model);
            // Cumulative profit for sparkline
            let cum = 0;
            const profitCurve = r.metrics.dailyProfitTrend.map(p => {
              cum += p;
              return Math.round(cum);
            });
            const sparklineDelay = Math.min(i * 70, 560);

            return (
              <tr key={r.id}>
                <td>{getRankBadge(i, locale)}</td>
                <td className="model-cell">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                    {logoSrc ? (
                      <img
                        src={logoSrc}
                        alt=""
                        aria-hidden
                        style={{ width: 18, height: 18, flex: "0 0 auto", objectFit: "contain" }}
                      />
                    ) : null}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <ModelNameMarquee name={shortModelName} />
                    </div>
                  </div>
                </td>
                <td className={`text-center ${r.finalScore >= 0 ? "profit-positive" : "profit-negative"}`}>
                  {formatYen(r.finalScore)}
                </td>
                <td className="text-center">{formatPct(dm.grossMargin)}</td>
                <td className="text-center">{formatPct(dm.errorRate)}</td>
                <td className="sparkline-cell">
                  <SparklineCell
                    data={profitCurve}
                    color={r.finalScore >= 0 ? "#10b981" : "#ef4444"}
                    showZero
                    animationDelay={sparklineDelay}
                  />
                </td>
                <td className="leaderboard-actions text-center">
                  <details className="action-menu">
                    <summary className="action-menu-trigger">
                      {text.view}
                      <span className="action-menu-caret" aria-hidden>▾</span>
                    </summary>
                    <div className="action-menu-list">
                      <a href={`${routePrefix}/report/${r.id}`} className="action-menu-item">{text.report}</a>
                      <a href={`${routePrefix}/replay/${r.id}`} className="action-menu-item">{text.replay}</a>
                    </div>
                  </details>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
