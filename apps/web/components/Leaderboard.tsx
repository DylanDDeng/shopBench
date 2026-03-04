"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { SimulationResult, DerivedMetrics } from "@/lib/types";
import { formatYen, formatPct } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { getModelMeta, type ModelOpenness, type ModelRegion } from "@/lib/modelMeta";
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
  changePct: string;
  changePctHelp: string;
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
  filterTitle: string;
  filterOpenness: string;
  filterRegion: string;
  filterSearch: string;
  filterAll: string;
  filterOpen: string;
  filterClosed: string;
  filterUnknown: string;
  filterRegionCn: string;
  filterRegionUs: string;
  filterRegionOther: string;
  filterRegionUnknown: string;
  filterReset: string;
  filterMatchCount: string;
  filterNoMatch: string;
}> = {
  en: {
    rank: "Rank",
    model: "Model",
    netCash: "30-Day Net Cash (¥) + Δ%",
    netCashHelp: "Top number is ranking metric: final cash minus starting cash minus outstanding loans. Lower line is final-cash return over 30 days: (final cash - starting cash) / starting cash.",
    changePct: "30-Day Change %",
    changePctHelp: "Final-cash return over 30 days: (final cash - starting cash) / starting cash.",
    grossMargin: "Gross Margin",
    grossMarginHelp: "(Revenue - COGS) / Revenue for sold items.",
    errorRate: "Tool Call Error Rate",
    errorRateHelp: "Percentage of tool calls that returned an error.",
    profit: "30-Day Net Profit Trend",
    profitHelp: "Day-by-day net profit trend (not cumulative).",
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
    filterTitle: "Model filters",
    filterOpenness: "Openness",
    filterRegion: "Region",
    filterSearch: "Search model",
    filterAll: "All",
    filterOpen: "Open-source",
    filterClosed: "Closed-source",
    filterUnknown: "Unknown",
    filterRegionCn: "China",
    filterRegionUs: "United States",
    filterRegionOther: "Other",
    filterRegionUnknown: "Unknown",
    filterReset: "Reset",
    filterMatchCount: "Showing",
    filterNoMatch: "No models match current filters.",
  },
  zh: {
    rank: "排名",
    model: "模型",
    netCash: "30天净现金 (¥) + 涨跌%",
    netCashHelp: "上行数字为排名指标：期末现金减去初始现金和未偿贷款。下行百分比为30天现金回报率：（期末现金 - 初始现金）/ 初始现金。",
    changePct: "30天涨跌幅",
    changePctHelp: "30天最终现金回报率：（期末现金 - 初始现金）/ 初始现金。",
    grossMargin: "毛利率",
    grossMarginHelp: "已售商品的 (收入 - 成本) / 收入。",
    errorRate: "工具调用错误率",
    errorRateHelp: "所有工具调用中返回错误的比例。",
    profit: "30天净利润趋势",
    profitHelp: "按天展示净利润变化（非累计口径）。",
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
    filterTitle: "模型筛选",
    filterOpenness: "授权",
    filterRegion: "地区",
    filterSearch: "搜索模型",
    filterAll: "全部",
    filterOpen: "开源",
    filterClosed: "闭源",
    filterUnknown: "未知",
    filterRegionCn: "中国",
    filterRegionUs: "美国",
    filterRegionOther: "其他",
    filterRegionUnknown: "未知",
    filterReset: "重置",
    filterMatchCount: "当前显示",
    filterNoMatch: "当前筛选下没有匹配模型。",
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

function formatSignedPct(value: number): string {
  const pct = value * 100;
  const abs = Math.abs(pct).toFixed(1);
  if (pct > 0.0001) return `+${abs}%`;
  if (pct < -0.0001) return `-${abs}%`;
  return "0.0%";
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
  if (key.includes("doubao") || key.includes("bytedance-seed")) return "/leaderboard/doubao-color.svg";
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

function getOpennessLabel(openness: ModelOpenness, text: typeof LEADERBOARD_TEXT[Locale]) {
  if (openness === "open") return text.filterOpen;
  if (openness === "closed") return text.filterClosed;
  return text.filterUnknown;
}

function getRegionLabel(region: ModelRegion, text: typeof LEADERBOARD_TEXT[Locale]) {
  if (region === "cn") return text.filterRegionCn;
  if (region === "us") return text.filterRegionUs;
  if (region === "other") return text.filterRegionOther;
  return text.filterRegionUnknown;
}

export function Leaderboard({ results, derivedMetrics, locale = "en" }: LeaderboardProps) {
  const text = LEADERBOARD_TEXT[locale];
  const routePrefix = `/${locale}`;
  const [opennessFilter, setOpennessFilter] = useState<ModelOpenness | "all">("all");
  const [regionFilter, setRegionFilter] = useState<ModelRegion | "all">("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      results.map((r, i) => {
        const dm = derivedMetrics[i];
        const shortModelName = (r.model.split("/").pop() ?? r.model).replace(/xhgih/gi, "xhigh");
        const meta = getModelMeta(r.model);
        return { r, dm, shortModelName, meta };
      }),
    [results, derivedMetrics],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter(({ r, shortModelName, meta }) => {
      if (opennessFilter !== "all" && meta.openness !== opennessFilter) return false;
      if (regionFilter !== "all" && meta.region !== regionFilter) return false;
      if (!normalizedQuery) return true;
      return (
        shortModelName.toLowerCase().includes(normalizedQuery) ||
        r.model.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [rows, opennessFilter, regionFilter, query]);

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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(160px, 1fr) minmax(150px, 1fr) minmax(170px, 1.2fr) auto",
          gap: "0.6rem",
          alignItems: "end",
          margin: "0.85rem 0 0.55rem",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: 4 }}>{text.filterOpenness}</div>
          <select
            value={opennessFilter}
            onChange={e => setOpennessFilter(e.target.value as ModelOpenness | "all")}
            style={{ width: "100%", border: "1px solid var(--border-primary)", borderRadius: "8px", height: "34px", padding: "0 10px", background: "var(--bg-card)" }}
          >
            <option value="all">{text.filterAll}</option>
            <option value="open">{text.filterOpen}</option>
            <option value="closed">{text.filterClosed}</option>
          </select>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: 4 }}>{text.filterRegion}</div>
          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value as ModelRegion | "all")}
            style={{ width: "100%", border: "1px solid var(--border-primary)", borderRadius: "8px", height: "34px", padding: "0 10px", background: "var(--bg-card)" }}
          >
            <option value="all">{text.filterAll}</option>
            <option value="cn">{text.filterRegionCn}</option>
            <option value="us">{text.filterRegionUs}</option>
          </select>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: 4 }}>{text.filterSearch}</div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={locale === "zh" ? "输入模型名（如 claude / qwen / gpt）" : "Type model name (e.g. claude / qwen / gpt)"}
            style={{ width: "100%", border: "1px solid var(--border-primary)", borderRadius: "8px", height: "34px", padding: "0 10px", background: "var(--bg-card)" }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setOpennessFilter("all");
            setRegionFilter("all");
            setQuery("");
          }}
          style={{
            height: "34px",
            border: "1px solid var(--border-primary)",
            borderRadius: "8px",
            background: "var(--bg-card)",
            padding: "0 12px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          {text.filterReset}
        </button>
      </div>
      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.55rem" }}>
        {text.filterMatchCount} {filteredRows.length} / {rows.length}
      </div>
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
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "1rem" }}>
                {text.filterNoMatch}
              </td>
            </tr>
          ) : filteredRows.map(({ r, dm, shortModelName, meta }, i) => {
            const logoSrc = getModelLogo(r.model);
            const startingCash = r.metrics.finalCash - r.finalScore - r.metrics.outstandingLoans;
            const cashDelta = r.metrics.finalCash - startingCash;
            const changePct = startingCash !== 0 ? (cashDelta / startingCash) : 0;
            // Day-by-day net profit (not cumulative)
            const profitCurve = r.metrics.dailyProfitTrend.map(p => Math.round(p));
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
                    <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                      <ModelNameMarquee name={shortModelName} />
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {getRegionLabel(meta.region, text)} · {getOpennessLabel(meta.openness, text)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-center cash-change-cell">
                  <div className={r.finalScore >= 0 ? "profit-positive" : "profit-negative"}>
                    {formatYen(r.finalScore)}
                  </div>
                  <div className={`cash-change-sub ${changePct >= 0 ? "profit-positive" : "profit-negative"}`}>
                    {formatSignedPct(changePct)}
                  </div>
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
