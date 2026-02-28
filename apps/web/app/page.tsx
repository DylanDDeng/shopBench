import { getAllResults, computeDerivedMetrics, formatYen, getModelDisplayName } from "@/lib/data";
import { Leaderboard } from "@/components/Leaderboard";

export default function Home() {
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
        <h1>ShopBench Leaderboard</h1>
        <p>
          Overall rank is based on 30-Day Net Cash. Gross margin and tool call error rate highlight different strengths and may have different winners.
        </p>
      </div>

      {results.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>No simulation results yet. Run a benchmark first:</p>
          <pre style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", padding: "1rem", borderRadius: "var(--radius-sm)", marginTop: "0.5rem", fontSize: "0.875rem" }}>
            {`pnpm run:bench -- --model openai/gpt-4o --verbose`}
          </pre>
        </div>
      ) : (
        <>
          <section className="top-signals" aria-label="Top Signals" style={{ marginBottom: "1.25rem" }}>
            <article className="top-signal top-signal-overall" title={best ? getModelDisplayName(best.model) : "–"}>
              <div className="top-signal-mark" aria-hidden>
                <img src="/leaderboard/claude-color.svg" alt="" />
              </div>
              <p className="top-signal-label">Overall Winner</p>
              <p className="top-signal-value">{best ? getModelDisplayName(best.model) : "–"}</p>
              <p className="top-signal-meta">Highest Net Cash &amp; Consistency</p>
            </article>

            <article className="top-signal top-signal-cash">
              <div className="top-signal-mark top-signal-mark-symbol" aria-hidden>¥</div>
              <p className="top-signal-label">Best 30-Day Net Cash</p>
              <p className="top-signal-value top-signal-value-cash">{best ? formatYen(best.finalScore) : "–"}</p>
              <p className="top-signal-meta">Top cash outcome</p>
            </article>

            <article className={`top-signal ${lowestErrorIsClaude ? "top-signal-claude" : "top-signal-error"}`} title={lowestErrorRateModel}>
              <div className={`top-signal-mark ${lowestErrorIsClaude ? "" : "top-signal-mark-symbol"}`} aria-hidden>
                {lowestErrorIsClaude ? <img src="/leaderboard/claude-color.svg" alt="" /> : "✓"}
              </div>
              <p className="top-signal-label">Lowest Tool Call Error Rate</p>
              <p className="top-signal-value">{lowestErrorRateModel}</p>
              <p className="top-signal-meta">Most reliable execution</p>
            </article>

            <article className="top-signal top-signal-margin" title={bestGrossMarginModel}>
              <div className="top-signal-mark" aria-hidden>
                <img src="/leaderboard/stepfun-color.svg" alt="" />
              </div>
              <p className="top-signal-label">Best Gross Margin</p>
              <p className="top-signal-value">{bestGrossMarginModel}</p>
              <p className="top-signal-meta">Most efficient sales mix</p>
            </article>
          </section>

          <Leaderboard results={results} derivedMetrics={derivedMetrics} />

          {results.length > 1 && (
            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <a href="/insights" className="action-link" style={{ fontSize: "1rem" }}>
                View Insights & Diagnostics →
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
