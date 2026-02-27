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

  return (
    <div className="container">
      <div className="page-header">
        <h1>ShopBench Leaderboard</h1>
        <p>
          Models ranked by 30-day net cash in a convenience-store simulation.
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
          <p className="about-note" style={{ marginBottom: "1rem" }}>
            Overall rank is based on 30-Day Net Cash. Gross margin and tool call error rate
            highlight different strengths and may have different winners.
          </p>

          <div className="leaderboard-highlights" style={{ marginBottom: "1.5rem" }}>
            <article className="highlight-card highlight-card-overall">
              <div className="highlight-watermark" aria-hidden>
                <img src="/leaderboard/claude-color.svg" alt="" />
              </div>
              <p className="highlight-kicker">Overall Winner</p>
              <div className="highlight-value">{best ? getModelDisplayName(best.model) : "–"}</div>
              <p className="highlight-subtitle">Highest Net Cash &amp; Consistency</p>
            </article>

            <article className="highlight-card highlight-card-cash">
              <div className="highlight-watermark highlight-watermark-symbol" aria-hidden>
                ¥
              </div>
              <p className="highlight-kicker">Best 30-Day Net Cash</p>
              <div className="highlight-value">{best ? formatYen(best.finalScore) : "–"}</div>
              <p className="highlight-subtitle">Record High Performance</p>
            </article>

            <article className="highlight-card highlight-card-error">
              <div className="highlight-watermark highlight-watermark-symbol" aria-hidden>
                ✓
              </div>
              <p className="highlight-kicker">Lowest Tool Call Error Rate</p>
              <div className="highlight-value">{lowestErrorRateModel}</div>
              <p className="highlight-subtitle">Most Reliable Execution</p>
            </article>

            <article className="highlight-card highlight-card-margin">
              <div className="highlight-watermark" aria-hidden>
                <img src="/leaderboard/minimax-color.svg" alt="" />
              </div>
              <p className="highlight-kicker">Best Gross Margin</p>
              <div className="highlight-value">{bestGrossMarginModel}</div>
              <p className="highlight-subtitle">Most Efficient Sales</p>
            </article>
          </div>

          <Leaderboard results={results} derivedMetrics={derivedMetrics} />

          {results.length > 1 && (
            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <a href="/compare" className="action-link" style={{ fontSize: "1rem" }}>
                Compare All Models →
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
