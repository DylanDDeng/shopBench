"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { AggregatedLeaderboardEntry } from "@/lib/types";
import { formatYen, formatPct } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { getModelMeta, type ModelOpenness, type ModelRegion } from "@/lib/modelMeta";

interface LeaderboardProps {
  entries: AggregatedLeaderboardEntry[];
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
  stability: string;
  stabilityHelp: string;
  grossMargin: string;
  grossMarginHelp: string;
  errorRate: string;
  errorRateHelp: string;
  actions: string;
  view: string;
  report: string;
  replay: string;
  medianReport: string;
  medianReplay: string;
  bestRun: string;
  worstRun: string;
  metricGuideTitle: string;
  metricGuideIntro: string;
  metricGuideAggregation: string;
  metricGuideNetCash: string;
  metricGuideGrossMargin: string;
  metricGuideErrorRate: string;
  metricGuideInventoryNote: string;
  filterTitle: string;
  filterOpenness: string;
  filterRegion: string;
  filterSearch: string;
  filterAll: string;
  filterOpen: string;
  filterClosed: string;
  filterUnknown: string;
  filterStealth: string;
  filterRegionCn: string;
  filterRegionUs: string;
  filterRegionOther: string;
  filterRegionUnknown: string;
  filterReset: string;
  filterMatchCount: string;
  filterNoMatch: string;
  runCount: string;
  positiveRuns: string;
  stable: string;
  medium: string;
  volatile: string;
}> = {
  en: {
    rank: "Rank",
    model: "Model",
    netCash: "Median 30-Day Net Cash (¥)",
    netCashHelp: "Primary ranking metric. If a model has multiple runs, we rank by the median net cash across those runs.",
    stability: "Stability (IQR)",
    stabilityHelp: "IQR = P75 - P25 of 30-Day Net Cash across repeated runs. Smaller means more stable.",
    grossMargin: "Median Gross Margin",
    grossMarginHelp: "Median gross margin across repeated runs.",
    errorRate: "Median Tool Call Error Rate",
    errorRateHelp: "Median tool call error rate across repeated runs.",
    actions: "Actions",
    view: "View",
    report: "Report",
    replay: "Replay",
    medianReport: "Median Report",
    medianReplay: "Median Replay",
    bestRun: "Best Run",
    worstRun: "Worst Run",
    metricGuideTitle: "Metric definitions (important)",
    metricGuideIntro: "Stable Ranking aggregates repeated runs of the same model. Single-run pages remain available from the action menu.",
    metricGuideAggregation: "Leaderboard rank is based on median 30-Day Net Cash across all runs currently present for that model.",
    metricGuideNetCash: "30-Day Net Cash = final cash - starting cash - outstanding loans. Median net cash is the primary ranking metric.",
    metricGuideGrossMargin: "Gross Margin is a ratio, not absolute cash generated. We show the median gross margin across runs.",
    metricGuideErrorRate: "Tool Call Error Rate is also aggregated by median, so one bad run does not dominate the model's headline metric.",
    metricGuideInventoryNote: "End-of-run inventory is not included in final score in this 30-day setup.",
    filterTitle: "Model filters",
    filterOpenness: "Openness",
    filterRegion: "Region",
    filterSearch: "Search model",
    filterAll: "All",
    filterOpen: "Open-source",
    filterClosed: "Closed-source",
    filterUnknown: "Unknown",
    filterStealth: "Stealth",
    filterRegionCn: "China",
    filterRegionUs: "United States",
    filterRegionOther: "Other",
    filterRegionUnknown: "Unknown",
    filterReset: "Reset",
    filterMatchCount: "Showing",
    filterNoMatch: "No models match current filters.",
    runCount: "runs",
    positiveRuns: "positive",
    stable: "Stable",
    medium: "Medium",
    volatile: "Volatile",
  },
  zh: {
    rank: "排名",
    model: "模型",
    netCash: "30天净现金中位数 (¥)",
    netCashHelp: "主排名指标。如果同一模型有多次运行，按这些运行的 30 天净现金中位数排序。",
    stability: "稳定性（IQR）",
    stabilityHelp: "IQR = 30 天净现金的 P75 - P25。越小表示越稳定。",
    grossMargin: "毛利率中位数",
    grossMarginHelp: "重复运行后的毛利率中位数。",
    errorRate: "工具调用错误率中位数",
    errorRateHelp: "重复运行后的工具错误率中位数。",
    actions: "操作",
    view: "查看",
    report: "报告",
    replay: "回放",
    medianReport: "中位数报告",
    medianReplay: "中位数回放",
    bestRun: "最佳单次",
    worstRun: "最差单次",
    metricGuideTitle: "指标口径说明（重要）",
    metricGuideIntro: "稳定性榜单会把同一模型的重复运行聚合起来。单次报告与回放仍然可以通过操作菜单进入。",
    metricGuideAggregation: "首页榜单按同一模型当前已有运行结果的 30 天净现金中位数排序。",
    metricGuideNetCash: "30天净现金 = 期末现金 - 初始现金 - 未偿贷款。中位数净现金是正式排名指标。",
    metricGuideGrossMargin: "毛利率是比例指标，不等于实际回笼现金规模。这里展示的是重复运行后的毛利率中位数。",
    metricGuideErrorRate: "工具调用错误率也按中位数聚合，避免单次异常 run 过度影响模型总览。",
    metricGuideInventoryNote: "在当前 30 天评测中，期末库存不计入最终得分。",
    filterTitle: "模型筛选",
    filterOpenness: "授权",
    filterRegion: "地区",
    filterSearch: "搜索模型",
    filterAll: "全部",
    filterOpen: "开源",
    filterClosed: "闭源",
    filterUnknown: "未知",
    filterStealth: "保密",
    filterRegionCn: "中国",
    filterRegionUs: "美国",
    filterRegionOther: "其他",
    filterRegionUnknown: "未知",
    filterReset: "重置",
    filterMatchCount: "当前显示",
    filterNoMatch: "当前筛选下没有匹配模型。",
    runCount: "次运行",
    positiveRuns: "次为正",
    stable: "稳定",
    medium: "中等波动",
    volatile: "高波动",
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

function formatRunSummary(entry: AggregatedLeaderboardEntry, locale: Locale, text: typeof LEADERBOARD_TEXT[Locale]): string {
  if (locale === "zh") return `${entry.runCount}${text.runCount} · ${entry.positiveRunCount}/${entry.runCount}${text.positiveRuns}`;
  return `${entry.runCount} ${text.runCount} · ${entry.positiveRunCount}/${entry.runCount} ${text.positiveRuns}`;
}

function getStabilityLabel(band: AggregatedLeaderboardEntry["stabilityBand"], text: typeof LEADERBOARD_TEXT[Locale]): string {
  if (band === "stable") return text.stable;
  if (band === "medium") return text.medium;
  return text.volatile;
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
  if (key.includes("hunter-alpha") || key.includes("healer-alpha")) return "/leaderboard/openrouter.svg";
  if (key.includes("mimo-v2-pro")) return "/leaderboard/xiaomimimo.svg";
  if (key.includes("claude")) return "/leaderboard/claude-color.svg";
  if (key.includes("doubao") || key.includes("bytedance-seed")) return "/leaderboard/doubao-color.svg";
  if (key.includes("stepfun") || key.includes("step-")) return "/leaderboard/stepfun-color.svg";
  if (key.includes("gemini")) return "/leaderboard/gemini-color.svg";
  if (key.includes("deepseek")) return "/leaderboard/deepseek-color.svg";
  if (key.includes("minimax")) return "/leaderboard/minimax-color.svg";
  if (key.includes("glm") || key.includes("zai") || key.includes("pony-alpha")) return "/leaderboard/zai.svg";
  if (key.includes("qwen")) return "/leaderboard/qwen-color.svg";
  if (key.includes("gpt") || key.includes("openai")) return "/leaderboard/openai.svg";
  if (key.includes("grok")) return "/leaderboard/grok.svg";
  if (key.includes("kimi") || key.includes("k2.5")) return "/leaderboard/kimi.svg";
  return null;
}

function getOpennessLabel(openness: ModelOpenness, text: typeof LEADERBOARD_TEXT[Locale]) {
  if (openness === "open") return text.filterOpen;
  if (openness === "closed") return text.filterClosed;
  if (openness === "stealth") return text.filterStealth;
  return text.filterUnknown;
}

function getRegionLabel(region: ModelRegion, text: typeof LEADERBOARD_TEXT[Locale]) {
  if (region === "cn") return text.filterRegionCn;
  if (region === "us") return text.filterRegionUs;
  if (region === "other") return text.filterRegionOther;
  if (region === "stealth") return text.filterStealth;
  return text.filterRegionUnknown;
}

export function Leaderboard({ entries, locale = "en" }: LeaderboardProps) {
  const text = LEADERBOARD_TEXT[locale];
  const routePrefix = `/${locale}`;
  const [opennessFilter, setOpennessFilter] = useState<ModelOpenness | "all">("all");
  const [regionFilter, setRegionFilter] = useState<ModelRegion | "all">("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      entries.map(entry => {
        const shortModelName = entry.displayName
          .replace(/xhgih/gi, "xhigh")
          .replace(/-hgih\b/gi, "-high");
        const meta = getModelMeta(entry.model);
        return { entry, shortModelName, meta };
      }),
    [entries],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter(({ entry, shortModelName, meta }) => {
      if (opennessFilter !== "all" && meta.openness !== opennessFilter) return false;
      if (regionFilter !== "all" && meta.region !== regionFilter) return false;
      if (!normalizedQuery) return true;
      return (
        shortModelName.toLowerCase().includes(normalizedQuery) ||
        entry.model.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [rows, opennessFilter, regionFilter, query]);

  return (
    <div className="card leaderboard-table">
      <details className="metrics-guide">
        <summary>{text.metricGuideTitle}</summary>
        <p className="metrics-guide-intro">{text.metricGuideIntro}</p>
        <ul className="metrics-guide-list">
          <li>{text.metricGuideAggregation}</li>
          <li>{text.metricGuideNetCash}</li>
          <li>{text.metricGuideGrossMargin}</li>
          <li>{text.metricGuideErrorRate}</li>
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
                label={text.stability}
                help={text.stabilityHelp}
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
          ) : filteredRows.map(({ entry, shortModelName, meta }, i) => {
            const logoSrc = getModelLogo(entry.model);
            const primaryReportLabel = entry.runCount > 1 ? text.medianReport : text.report;
            const primaryReplayLabel = entry.runCount > 1 ? text.medianReplay : text.replay;
            const actionLinks = [
              { href: `${routePrefix}/report/${entry.medianRunId}`, label: primaryReportLabel },
              { href: `${routePrefix}/replay/${entry.medianRunId}`, label: primaryReplayLabel },
            ];
            if (entry.bestRunId !== entry.medianRunId) {
              actionLinks.push({ href: `${routePrefix}/report/${entry.bestRunId}`, label: text.bestRun });
            }
            if (entry.worstRunId !== entry.medianRunId && entry.worstRunId !== entry.bestRunId) {
              actionLinks.push({ href: `${routePrefix}/report/${entry.worstRunId}`, label: text.worstRun });
            }

            return (
              <tr key={`${entry.displayName}-${entry.medianRunId}`}>
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
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {formatRunSummary(entry, locale, text)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-center cash-change-cell">
                  <div className={entry.medianFinalScore >= 0 ? "profit-positive" : "profit-negative"}>
                    {formatYen(entry.medianFinalScore)}
                  </div>
                  <div className={`cash-change-sub ${entry.positiveRunRate >= 0.5 ? "profit-positive" : "profit-negative"}`}>
                    {entry.positiveRunCount}/{entry.runCount} {text.positiveRuns}
                  </div>
                </td>
                <td className="text-center">
                  <span className={`stability-pill stability-pill-${entry.stabilityBand}`}>
                    {getStabilityLabel(entry.stabilityBand, text)}
                  </span>
                  <div className="cash-change-sub">{formatYen(entry.finalScoreIqr)}</div>
                </td>
                <td className="text-center">{formatPct(entry.medianGrossMargin)}</td>
                <td className="text-center">{formatPct(entry.medianErrorRate)}</td>
                <td className="leaderboard-actions text-center">
                  <details className="action-menu">
                    <summary className="action-menu-trigger">
                      {text.view}
                      <span className="action-menu-caret" aria-hidden>▾</span>
                    </summary>
                    <div className="action-menu-list">
                      {actionLinks.map(link => (
                        <a key={link.href} href={link.href} className="action-menu-item">{link.label}</a>
                      ))}
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
