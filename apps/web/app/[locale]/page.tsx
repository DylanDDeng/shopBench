import { notFound } from "next/navigation";
import { getAllResults, computeDerivedMetrics, formatYen, getModelDisplayName } from "@/lib/data";
import { Leaderboard } from "@/components/Leaderboard";
import { isLocale } from "@/lib/i18n";

export default function LocaleHomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale = params.locale;
  const isZh = locale === "zh";
  const text = isZh
    ? {
        title: "ShopBench 排行榜",
        subtitle:
          "总排名基于 30 天净现金。毛利率与工具调用错误率展示不同能力维度，冠军可能不同。",
        empty: "暂无模拟结果。请先运行 benchmark：",
        topSignals: "核心信号",
        overallWinner: "总冠军",
        overallWinnerMeta: "净现金与稳定性最佳",
        bestCash: "30天净现金最佳",
        bestCashMeta: "现金结果领先",
        lowestError: "工具调用错误率最低",
        lowestErrorMeta: "执行最稳定",
        bestMargin: "毛利率最佳",
        bestMarginMeta: "销售组合效率最高",
        compareAll: "对比全部模型 →",
      }
    : {
        title: "ShopBench Leaderboard",
        subtitle:
          "Overall rank is based on 30-Day Net Cash. Gross margin and tool call error rate highlight different strengths and may have different winners.",
        empty: "No simulation results yet. Run a benchmark first:",
        topSignals: "Top Signals",
        overallWinner: "Overall Winner",
        overallWinnerMeta: "Highest Net Cash & Consistency",
        bestCash: "Best 30-Day Net Cash",
        bestCashMeta: "Top cash outcome",
        lowestError: "Lowest Tool Call Error Rate",
        lowestErrorMeta: "Most reliable execution",
        bestMargin: "Best Gross Margin",
        bestMarginMeta: "Most efficient sales mix",
        compareAll: "Compare All Models →",
      };

  const results = getAllResults();
  const derivedMetrics = results.map(r => computeDerivedMetrics(r));

  const best = results[0];
  const lowestErrorRateModel = derivedMetrics.length > 0
    ? getModelDisplayName(
        results[
          derivedMetrics.reduce(
            (bestIdx, dm, idx) => (dm.errorRate < derivedMetrics[bestIdx].errorRate ? idx : bestIdx),
            0,
          )
        ].model,
      )
    : "–";
  const bestGrossMarginModel = derivedMetrics.length > 0
    ? getModelDisplayName(
        results[
          derivedMetrics.reduce(
            (bestIdx, dm, idx) => (dm.grossMargin > derivedMetrics[bestIdx].grossMargin ? idx : bestIdx),
            0,
          )
        ].model,
      )
    : "–";
  const lowestErrorIsClaude = lowestErrorRateModel.toLowerCase().includes("claude");

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
            <article className="top-signal top-signal-overall" title={best ? getModelDisplayName(best.model) : "–"}>
              <div className="top-signal-mark" aria-hidden>
                <img src="/leaderboard/claude-color.svg" alt="" />
              </div>
              <p className="top-signal-label">{text.overallWinner}</p>
              <p className="top-signal-value">{best ? getModelDisplayName(best.model) : "–"}</p>
              <p className="top-signal-meta">{text.overallWinnerMeta}</p>
            </article>

            <article className="top-signal top-signal-cash">
              <div className="top-signal-mark top-signal-mark-symbol" aria-hidden>¥</div>
              <p className="top-signal-label">{text.bestCash}</p>
              <p className="top-signal-value top-signal-value-cash">{best ? formatYen(best.finalScore) : "–"}</p>
              <p className="top-signal-meta">{text.bestCashMeta}</p>
            </article>

            <article className={`top-signal ${lowestErrorIsClaude ? "top-signal-claude" : "top-signal-error"}`} title={lowestErrorRateModel}>
              <div className={`top-signal-mark ${lowestErrorIsClaude ? "" : "top-signal-mark-symbol"}`} aria-hidden>
                {lowestErrorIsClaude ? <img src="/leaderboard/claude-color.svg" alt="" /> : "✓"}
              </div>
              <p className="top-signal-label">{text.lowestError}</p>
              <p className="top-signal-value">{lowestErrorRateModel}</p>
              <p className="top-signal-meta">{text.lowestErrorMeta}</p>
            </article>

            <article className="top-signal top-signal-margin" title={bestGrossMarginModel}>
              <div className="top-signal-mark" aria-hidden>
                <img src="/leaderboard/minimax-color.svg" alt="" />
              </div>
              <p className="top-signal-label">{text.bestMargin}</p>
              <p className="top-signal-value">{bestGrossMarginModel}</p>
              <p className="top-signal-meta">{text.bestMarginMeta}</p>
            </article>
          </section>

          <Leaderboard results={results} derivedMetrics={derivedMetrics} locale={locale} />

          {results.length > 1 && (
            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <a href={`/${locale}/compare`} className="action-link" style={{ fontSize: "1rem" }}>
                {text.compareAll}
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
