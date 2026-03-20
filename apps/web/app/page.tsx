import { getAllResults, getAggregatedLeaderboard, formatYen } from "@/lib/data";
import { Leaderboard } from "@/components/Leaderboard";

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

export default function Home() {
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
        <h1>ShopBench Leaderboard</h1>
        <p>
          Stable Ranking uses each model's 5 most recent runs and ranks them by trimmed mean 30-Day Net Cash, dropping the best and worst run. Median, gross margin, and tool call error rate still highlight different strengths.
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
              <p className="top-signal-meta">Highest trimmed mean net cash across the 5 most recent runs</p>
            </article>

            <article className="top-signal top-signal-cash">
              <div className="top-signal-mark top-signal-mark-symbol" aria-hidden>¥</div>
              <p className="top-signal-label">Best Trimmed Mean 30-Day Net Cash</p>
              <p className="top-signal-value top-signal-value-cash">{best ? formatYen(best.trimmedMeanFinalScore) : "–"}</p>
              <p className="top-signal-meta">Best trimmed mean outcome across the 5 most recent runs</p>
            </article>

            <article className={`top-signal ${lowestErrorLogo?.includes("claude") ? "top-signal-claude" : "top-signal-error"}`} title={lowestErrorEntry?.displayName ?? "–"}>
              <div className={`top-signal-mark ${lowestErrorLogo ? "" : "top-signal-mark-symbol"}`} aria-hidden>
                {lowestErrorLogo ? <img src={lowestErrorLogo} alt="" /> : "✓"}
              </div>
              <p className="top-signal-label">Lowest Tool Call Error Rate</p>
              <p className="top-signal-value">{lowestErrorEntry?.displayName ?? "–"}</p>
              <p className="top-signal-meta">Lowest median tool error rate</p>
            </article>

            <article className="top-signal top-signal-margin" title={bestMarginEntry?.displayName ?? "–"}>
              <div className="top-signal-mark" aria-hidden>
                {bestMarginLogo ? <img src={bestMarginLogo} alt="" /> : "▦"}
              </div>
              <p className="top-signal-label">Best Gross Margin</p>
              <p className="top-signal-value">{bestMarginEntry?.displayName ?? "–"}</p>
              <p className="top-signal-meta">Highest median gross margin</p>
            </article>
          </section>

          <Leaderboard entries={leaderboard} />

          {leaderboard.length > 1 && (
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
