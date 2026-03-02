import { getAllResults, computeDerivedMetrics, formatYen, getModelDisplayName } from "@/lib/data";
import { Leaderboard } from "@/components/Leaderboard";

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

export default function Home() {
  const results = getAllResults();
  const derivedMetrics = results.map(r => computeDerivedMetrics(r));

  const best = results[0];
  const bestModelName = best ? getModelDisplayName(best.model) : "–";
  const bestModelLogo = best ? getModelLogo(best.model) : null;
  const bestIsGpt = !!best && (best.model.toLowerCase().includes("gpt") || best.model.toLowerCase().includes("openai"));
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
            <article
              className={`top-signal top-signal-overall${bestIsGpt ? " top-signal-overall-gpt" : ""}`}
              title={bestModelName}
            >
              <div className="top-signal-mark" aria-hidden>
                {bestModelLogo ? <img src={bestModelLogo} alt="" /> : "★"}
              </div>
              <p className="top-signal-label">Overall Winner</p>
              <p className="top-signal-value">{bestModelName}</p>
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
