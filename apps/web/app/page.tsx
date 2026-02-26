import { getAllResults, computeDerivedMetrics, formatYen, getModelDisplayName } from "@/lib/data";
import { Leaderboard } from "@/components/Leaderboard";
import { MetricCard } from "@/components/MetricCard";

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

          <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
            <MetricCard
              value={best ? getModelDisplayName(best.model) : "–"}
              label="Overall Winner"
              color="#fbbf24"
            />
            <MetricCard
              value={best ? formatYen(best.finalScore) : "–"}
              label="Best 30-Day Net Cash"
              color={best && best.finalScore >= 0 ? "#10b981" : "#ef4444"}
            />
            <MetricCard
              value={lowestErrorRateModel}
              label="Lowest Tool Call Error Rate"
              color="#06b6d4"
            />
            <MetricCard
              value={bestGrossMarginModel}
              label="Best Gross Margin"
              color="#a78bfa"
            />
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
