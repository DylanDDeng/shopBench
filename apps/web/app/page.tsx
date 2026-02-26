import { getAllResults, computeDerivedMetrics, formatYen, getModelDisplayName } from "@/lib/data";
import { Leaderboard } from "@/components/Leaderboard";
import { MetricCard } from "@/components/MetricCard";

export default function Home() {
  const results = getAllResults();
  const derivedMetrics = results.map(r => computeDerivedMetrics(r));

  const best = results[0];
  const avgScore = results.length > 0
    ? results.reduce((s, r) => s + r.finalScore, 0) / results.length
    : 0;
  const mostEfficient = results.length > 0
    ? results.reduce((best, r, i) => {
        const dm = derivedMetrics[i];
        const eff = r.metrics.totalToolCalls > 0 ? r.finalScore / r.metrics.totalToolCalls : 0;
        const bestEff = best.r.metrics.totalToolCalls > 0 ? best.r.finalScore / best.r.metrics.totalToolCalls : 0;
        return eff > bestEff ? { r, i } : best;
      }, { r: results[0], i: 0 })
    : null;
  const highestRevenue = results.length > 0
    ? results.reduce((best, r, i) => derivedMetrics[i].totalRevenue > derivedMetrics[best].totalRevenue ? i : best, 0)
    : 0;

  return (
    <div className="container">
      <div className="page-header">
        <h1>ShopBench Leaderboard</h1>
        <p>
          AI models ranked by net profit from a 30-day convenience store management simulation
        </p>
      </div>

      {results.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>No simulation results yet. Run a benchmark first:</p>
          <pre style={{ background: "var(--bg-primary)", padding: "1rem", borderRadius: "var(--radius-sm)", marginTop: "0.5rem", fontSize: "0.875rem" }}>
            {`pnpm run:bench -- --model openai/gpt-4o --verbose`}
          </pre>
        </div>
      ) : (
        <>
          <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
            <MetricCard
              value={best ? getModelDisplayName(best.model) : "–"}
              label="Top Model"
              color="#fbbf24"
            />
            <MetricCard
              value={best ? formatYen(best.finalScore) : "–"}
              label="Best 30-Day Net Cash"
              color={best && best.finalScore >= 0 ? "#10b981" : "#ef4444"}
            />
            <MetricCard
              value={formatYen(avgScore)}
              label="Average 30-Day Net Cash"
              color={avgScore >= 0 ? "#10b981" : "#ef4444"}
            />
            <MetricCard
              value={mostEfficient ? getModelDisplayName(mostEfficient.r.model) : "–"}
              label="Most Efficient"
              color="#06b6d4"
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
