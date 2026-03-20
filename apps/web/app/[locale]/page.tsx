import { notFound } from "next/navigation";
import { getAllResults, getAggregatedLeaderboard, formatYen } from "@/lib/data";
import { Leaderboard } from "@/components/Leaderboard";
import { isLocale } from "@/lib/i18n";

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

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }
  const isZh = locale === "zh";
  const text = isZh
    ? {
        title: "ShopBench 排行榜",
        subtitle:
          "稳定性榜单会取同一模型最近 5 次运行，并按 30 天净现金中位数排序。毛利率与工具调用错误率仍用于观察不同能力维度。",
        empty: "暂无模拟结果。请先运行 benchmark：",
        topSignals: "核心信号",
        overallWinner: "总冠军",
        overallWinnerMeta: "最近 5 次运行下的中位净现金最高",
        bestCash: "30天净现金中位数最佳",
        bestCashMeta: "最近 5 次运行后的典型现金结果领先",
        lowestError: "工具调用错误率最低",
        lowestErrorMeta: "中位错误率最低",
        bestMargin: "毛利率最佳",
        bestMarginMeta: "中位毛利率最高",
        compareAll: "查看洞察与诊断 →",
      }
    : {
        title: "ShopBench Leaderboard",
        subtitle:
          "Stable Ranking uses each model's 5 most recent runs and ranks them by median 30-Day Net Cash. Gross margin and tool call error rate still highlight different strengths.",
        empty: "No simulation results yet. Run a benchmark first:",
        topSignals: "Top Signals",
        overallWinner: "Overall Winner",
        overallWinnerMeta: "Highest median net cash across the 5 most recent runs",
        bestCash: "Best Median 30-Day Net Cash",
        bestCashMeta: "Top typical cash outcome across the 5 most recent runs",
        lowestError: "Lowest Tool Call Error Rate",
        lowestErrorMeta: "Lowest median tool error rate",
        bestMargin: "Best Gross Margin",
        bestMarginMeta: "Highest median gross margin",
        compareAll: "View Insights & Diagnostics →",
      };

  const results = getAllResults();
  const leaderboard = getAggregatedLeaderboard(results);

  const best = leaderboard[0];
  const bestModelName = best?.displayName ?? "–";
  const bestModelLogo = best ? getModelLogo(best.model) : null;
  const bestIsGpt = !!best && (best.model.toLowerCase().includes("gpt") || best.model.toLowerCase().includes("openai"));
  const lowestErrorEntry = leaderboard.reduce((bestEntry, entry) => (
    !bestEntry || entry.medianErrorRate < bestEntry.medianErrorRate ? entry : bestEntry
  ), null as (typeof leaderboard)[number] | null);
  const bestMarginEntry = leaderboard.reduce((bestEntry, entry) => (
    !bestEntry || entry.medianGrossMargin > bestEntry.medianGrossMargin ? entry : bestEntry
  ), null as (typeof leaderboard)[number] | null);
  const lowestErrorLogo = lowestErrorEntry ? getModelLogo(lowestErrorEntry.model) : null;
  const bestMarginLogo = bestMarginEntry ? getModelLogo(bestMarginEntry.model) : null;

  return (
    <div className="container">
      <div className="page-header">
        <h1>{text.title}</h1>
        <p>{text.subtitle}</p>
      </div>

      {results.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>{text.empty}</p>
          <pre style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", padding: "1rem", borderRadius: "var(--radius-sm)", marginTop: "0.5rem", fontSize: "0.875rem" }}>
            {`pnpm run:bench -- --model openai/gpt-4o --verbose`}
          </pre>
        </div>
      ) : (
        <>
          <section className="top-signals" aria-label={text.topSignals} style={{ marginBottom: "1.25rem" }}>
            <article
              className={`top-signal top-signal-overall${bestIsGpt ? " top-signal-overall-gpt" : ""}`}
              title={bestModelName}
            >
              <div className="top-signal-mark" aria-hidden>
                {bestModelLogo ? <img src={bestModelLogo} alt="" /> : "★"}
              </div>
              <p className="top-signal-label">{text.overallWinner}</p>
              <p className="top-signal-value">{bestModelName}</p>
              <p className="top-signal-meta">{text.overallWinnerMeta}</p>
            </article>

            <article className="top-signal top-signal-cash">
              <div className="top-signal-mark top-signal-mark-symbol" aria-hidden>¥</div>
              <p className="top-signal-label">{text.bestCash}</p>
              <p className="top-signal-value top-signal-value-cash">{best ? formatYen(best.medianFinalScore) : "–"}</p>
              <p className="top-signal-meta">{text.bestCashMeta}</p>
            </article>

            <article className={`top-signal ${lowestErrorLogo?.includes("claude") ? "top-signal-claude" : "top-signal-error"}`} title={lowestErrorEntry?.displayName ?? "–"}>
              <div className={`top-signal-mark ${lowestErrorLogo ? "" : "top-signal-mark-symbol"}`} aria-hidden>
                {lowestErrorLogo ? <img src={lowestErrorLogo} alt="" /> : "✓"}
              </div>
              <p className="top-signal-label">{text.lowestError}</p>
              <p className="top-signal-value">{lowestErrorEntry?.displayName ?? "–"}</p>
              <p className="top-signal-meta">{text.lowestErrorMeta}</p>
            </article>

            <article className="top-signal top-signal-margin" title={bestMarginEntry?.displayName ?? "–"}>
              <div className="top-signal-mark" aria-hidden>
                {bestMarginLogo ? <img src={bestMarginLogo} alt="" /> : "▦"}
              </div>
              <p className="top-signal-label">{text.bestMargin}</p>
              <p className="top-signal-value">{bestMarginEntry?.displayName ?? "–"}</p>
              <p className="top-signal-meta">{text.bestMarginMeta}</p>
            </article>
          </section>

          <Leaderboard entries={leaderboard} locale={locale} />

          {leaderboard.length > 1 && (
            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <a href={`/${locale}/insights`} className="action-link" style={{ fontSize: "1rem" }}>
                {text.compareAll}
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
