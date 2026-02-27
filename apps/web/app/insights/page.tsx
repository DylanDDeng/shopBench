import {
  getAllResults,
  computeDerivedMetrics,
  getModelDisplayName,
  formatYen,
  formatPct,
  getToolCategory,
  getToolLabel,
} from "@/lib/data";
import { SectionHeader } from "@/components/SectionHeader";
import { InsightCard } from "@/components/InsightCard";
import { CaseStudyCard } from "@/components/CaseStudyCard";
import { InsightsContent } from "./InsightsContent";
import { DeepDiveReports, type DeepDiveReport } from "./DeepDiveReports";
import type { DerivedMetrics, SimulationResult } from "@/lib/types";

/* ─── Per-model analysis data ─── */

interface ModelAnalysis {
  model: string;
  displayName: string;
  netProfit: number;
  setPriceCalls: number;
  purchaseCalls: number;
  zeroRevenueDays: number;
  profitableDays: number;
  infoActionRatio: number;
  totalRevenue: number;
  grossMargin: number;
  errorRate: number;
  totalToolCalls: number;
  estimateOrderCalls: number;
  color: string;
}

type StrategyType = "aggressive" | "balanced" | "conservative" | "over-analyzer" | "passive";

interface StrategyGroupData {
  type: StrategyType;
  color: string;
  emoji: string;
  title: string;
  models: ModelAnalysis[];
  summary: string;
  avgNetProfit: number;
}

/* ─── Strategy classification ─── */

const STRATEGY_META: Record<StrategyType, { color: string; emoji: string; title: string }> = {
  aggressive: { color: "#10b981", emoji: "\u{1F7E2}", title: "Aggressive Growth" },
  balanced: { color: "#60a5fa", emoji: "\u{1F535}", title: "Balanced Operators" },
  conservative: { color: "#f59e0b", emoji: "\u{1F7E1}", title: "Conservative Observers" },
  "over-analyzer": { color: "#f97316", emoji: "\u{1F7E0}", title: "Over-Analyzers" },
  passive: { color: "#ef4444", emoji: "\u{1F534}", title: "Passive Strugglers" },
};

function classifyStrategy(m: ModelAnalysis): StrategyType {
  const profitable = m.netProfit > 0;
  const marginalLoss = m.netProfit > -2000 && m.netProfit <= 0;
  const highFreqPrice = m.setPriceCalls > 40;
  const midFreqPrice = m.setPriceCalls >= 10 && m.setPriceCalls <= 40;
  const lowFreqPrice = m.setPriceCalls < 10;
  const hasStockouts = m.zeroRevenueDays > 3;
  const highInfoRatio = m.infoActionRatio > 3;

  if (profitable && highFreqPrice) return "aggressive";
  if ((profitable || marginalLoss) && midFreqPrice) return "balanced";
  if (hasStockouts && highInfoRatio) return "over-analyzer";
  if (marginalLoss && lowFreqPrice) return "conservative";
  return "passive";
}

/* ─── Compute correlation coefficient ─── */

function pearsonR(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

/* ─── Strategy summary text ─── */

const STRATEGY_SUMMARIES: Record<StrategyType, string> = {
  aggressive:
    "High-frequency price adjusters who actively restock and promote. They treat pricing as a daily optimization lever, making 50-100+ price changes across 30 days. Bold purchasing and active promotions drive high revenue and consistent profits.",
  balanced:
    "Moderate price adjusters with steady operational cadence. These models find a middle ground — enough price changes to stay competitive without over-optimizing. Purchases and promotions are measured and deliberate.",
  conservative:
    "Cautious operators who rarely adjust prices. They rely on default strategies and minimal intervention, often missing revenue opportunities from stale pricing. Purchases are infrequent but orderly.",
  "over-analyzer":
    "Paralysis by analysis — these models spend most tool calls gathering information rather than taking action. The extreme info-to-action ratio (>3:1) means they research endlessly while inventory runs out and revenue stalls.",
  passive:
    "Models that struggle with the fundamental mechanics of store management. Low purchase rates, minimal pricing, and high zero-revenue days indicate a failure to maintain basic store operations.",
};

/* ─── Page component ─── */

export default function InsightsPage() {
  const results = getAllResults();

  if (results.length === 0) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Strategy Insights</h1>
          <p>No simulation results available. Run benchmarks first to see insights.</p>
        </div>
      </div>
    );
  }

  const derivedMetrics = results.map(r => computeDerivedMetrics(r));

  // Build per-model analysis
  const MODEL_COLORS = [
    "#60a5fa", "#10b981", "#f59e0b", "#ef4444", "#a78bfa",
    "#ec4899", "#06b6d4", "#84cc16", "#fb923c", "#8b5cf6",
    "#14b8a6", "#f43f5e", "#22d3ee", "#a3e635",
  ];

  const analyses: ModelAnalysis[] = results.map((r, idx) => {
    const dm = derivedMetrics[idx];

    // Count zero-revenue days
    let zeroRevenueDays = 0;
    for (const d of r.days) {
      if (d.settlement.revenue === 0) zeroRevenueDays++;
    }

    // Compute info/action ratio
    let infoCalls = 0;
    let actionCalls = 0;
    for (const [name, count] of Object.entries(dm.callsByType)) {
      const cat = getToolCategory(name);
      if (cat === "info") infoCalls += count;
      else actionCalls += count;
    }
    const infoActionRatio = actionCalls > 0 ? infoCalls / actionCalls : infoCalls > 0 ? Infinity : 0;

    const purchaseCalls = dm.callsByType["purchase_goods"] ?? 0;
    const estimateOrderCalls = dm.callsByType["estimate_order"] ?? 0;

    return {
      model: r.model,
      displayName: getModelDisplayName(r.model),
      netProfit: r.metrics.netProfit,
      setPriceCalls: dm.setPriceCalls,
      purchaseCalls,
      zeroRevenueDays,
      profitableDays: r.days.filter(d => d.settlement.netProfit > 0).length,
      infoActionRatio,
      totalRevenue: dm.totalRevenue,
      grossMargin: dm.grossMargin,
      errorRate: dm.errorRate,
      totalToolCalls: r.metrics.totalToolCalls,
      estimateOrderCalls,
      color: MODEL_COLORS[idx % MODEL_COLORS.length],
    };
  });

  // Classify into strategy groups
  const groupMap = new Map<StrategyType, ModelAnalysis[]>();
  const strategyByModel = new Map<string, StrategyType>();
  for (const m of analyses) {
    const type = classifyStrategy(m);
    strategyByModel.set(m.model, type);
    if (!groupMap.has(type)) groupMap.set(type, []);
    groupMap.get(type)!.push(m);
  }

  const strategyOrder: StrategyType[] = ["aggressive", "balanced", "conservative", "over-analyzer", "passive"];
  const strategyGroups: StrategyGroupData[] = strategyOrder
    .filter(t => groupMap.has(t))
    .map(type => {
      const models = groupMap.get(type)!;
      const avgNetProfit = models.reduce((s, m) => s + m.netProfit, 0) / models.length;
      const meta = STRATEGY_META[type];
      return {
        type,
        ...meta,
        models,
        summary: STRATEGY_SUMMARIES[type],
        avgNetProfit,
      };
    });

  // Scatter chart data
  const scatterData = analyses.map(m => ({
    displayName: m.displayName,
    setPriceCalls: m.setPriceCalls,
    netProfit: m.netProfit,
    totalRevenue: m.totalRevenue,
    color: m.color,
  }));

  // Compute the 5 insights
  const profitableCount = analyses.filter(m => m.netProfit > 0).length;
  const profitableRate = analyses.length > 0 ? profitableCount / analyses.length : 0;

  const priceR = pearsonR(
    analyses.map(m => m.setPriceCalls),
    analyses.map(m => m.netProfit),
  );

  const highestRevModel = analyses.reduce((best, m) => m.totalRevenue > best.totalRevenue ? m : best, analyses[0]);
  const highestProfitModel = analyses.reduce((best, m) => m.netProfit > best.netProfit ? m : best, analyses[0]);

  const profitableModels = analyses.filter(m => m.netProfit > 0);
  const avgInfoRatioProfitable = profitableModels.length > 0
    ? profitableModels.reduce((s, m) => s + (Number.isFinite(m.infoActionRatio) ? m.infoActionRatio : 0), 0) / profitableModels.length
    : 0;

  // Find largest vs smallest model comparison (Opus vs Sonnet pattern)
  const sortedByProfit = [...analyses].sort((a, b) => b.netProfit - a.netProfit);
  const bestModel = sortedByProfit[0];
  const worstModel = sortedByProfit[sortedByProfit.length - 1];

  const insights = [
    {
      icon: "\u{1F4CA}",
      value: formatPct(profitableRate),
      label: "Profitability Rate",
      description: `Only ${profitableCount} of ${analyses.length} models achieved positive profit over 30 days`,
    },
    {
      icon: "\u{1F4C8}",
      value: `r = ${priceR.toFixed(2)}`,
      label: "Price Changes \u{2194} Profit",
      description: "Strong correlation between pricing frequency and net profit across all models",
    },
    {
      icon: "\u{26A0}\u{FE0F}",
      value: formatYen(highestRevModel.totalRevenue),
      label: "Revenue \u{2260} Profit",
      description: `${highestRevModel.displayName} had highest revenue but ${highestRevModel.displayName === highestProfitModel.displayName ? "also topped profit" : `${highestProfitModel.displayName} was more profitable`}`,
    },
    {
      icon: "\u{2696}\u{FE0F}",
      value: `${avgInfoRatioProfitable.toFixed(1)}:1`,
      label: "Optimal Info/Action Ratio",
      description: "Average info-to-action ratio among profitable models \u{2014} too high means analysis paralysis",
    },
    {
      icon: "\u{1F9E0}",
      value: `#1 vs #${sortedByProfit.length}`,
      label: "Size \u{2260} Performance",
      description: `${bestModel.displayName} outperformed ${worstModel.displayName} \u{2014} bigger models aren't always better`,
    },
  ];
  const strongestGroup = [...strategyGroups].sort((a, b) => b.avgNetProfit - a.avgNetProfit)[0];
  const largestGroup = [...strategyGroups].sort((a, b) => b.models.length - a.models.length)[0];

  // Case studies — find specific patterns in the data
  const caseStudies = buildCaseStudies(analyses, results);
  const deepDiveReports = buildDeepDiveReports({
    results,
    analyses,
    derivedMetrics,
    strategyByModel,
  });

  return (
    <div className="container">
      <div className="page-header">
        <h1>Strategy Insights</h1>
        <p>
          Cross-model analysis of pricing strategies, operational patterns, and failure modes from {analyses.length} AI models
        </p>
      </div>

      <section className="insights-intro card-flat">
        <div className="insights-intro-kicker">Insights Brief</div>
        <h2 className="insights-intro-title">What separates winning model operators from struggling ones</h2>
        <p className="insights-intro-copy">
          Top performers combine frequent price adjustments with disciplined purchasing and low tool-call failure. Low performers
          either under-act on pricing or spend too much on analysis without execution.
        </p>
        <div className="insights-intro-pills">
          <div className="insights-intro-pill">
            <span>Profitable Models</span>
            <strong>{profitableCount} / {analyses.length}</strong>
          </div>
          <div className="insights-intro-pill">
            <span>Best Correlation Signal</span>
            <strong>Pricing ↔ Net Cash (r={priceR.toFixed(2)})</strong>
          </div>
          {strongestGroup ? (
            <div className="insights-intro-pill">
              <span>Strongest Strategy Cluster</span>
              <strong>{strongestGroup.title}</strong>
            </div>
          ) : null}
          {largestGroup ? (
            <div className="insights-intro-pill">
              <span>Largest Strategy Cluster</span>
              <strong>{largestGroup.title} ({largestGroup.models.length})</strong>
            </div>
          ) : null}
        </div>
      </section>

      <section className="insights-block">
        <div className="insights-block-head">
          <h2>Key Findings</h2>
          <span className="insights-block-subtitle">across {analyses.length} models</span>
        </div>
        <div className="insight-grid insight-grid-premium">
          {insights.map((ins, i) => (
            <InsightCard key={i} {...ins} />
          ))}
        </div>
      </section>

      <InsightsContent
        scatterData={scatterData}
        strategyGroups={strategyGroups.map(g => ({
          type: g.type,
          color: g.color,
          emoji: g.emoji,
          title: g.title,
          models: g.models.map(m => ({
            displayName: m.displayName,
            netProfit: m.netProfit,
            setPriceCalls: m.setPriceCalls,
            purchaseCalls: m.purchaseCalls,
            totalRevenue: m.totalRevenue,
            zeroRevenueDays: m.zeroRevenueDays,
          })),
          summary: g.summary,
          avgNetProfit: g.avgNetProfit,
        }))}
      />

      <section className="insights-block">
        <div className="insights-block-head">
          <h2>Failure Case Studies</h2>
          <span className="insights-block-subtitle">patterns to avoid</span>
        </div>
        <div className="case-study-grid">
          {caseStudies.map((cs, i) => (
            <CaseStudyCard key={i} {...cs} />
          ))}
        </div>
      </section>

      <SectionHeader title="Model Deep Dive Reports" subtitle="long-form per model analysis with chart evidence" />
      <DeepDiveReports reports={deepDiveReports} />
    </div>
  );
}

/* ─── Build case studies from actual data ─── */

function buildCaseStudies(
  analyses: ModelAnalysis[],
  results: SimulationResult[],
) {
  const cases: {
    icon: string;
    title: string;
    model: string;
    narrative: string;
    stats: { label: string; value: string }[];
    accentColor: string;
  }[] = [];

  // Case 1: Analysis Paralysis — highest info/action ratio model
  const overAnalyzer = [...analyses]
    .filter(m => Number.isFinite(m.infoActionRatio))
    .sort((a, b) => b.infoActionRatio - a.infoActionRatio)[0];
  if (overAnalyzer && overAnalyzer.infoActionRatio > 2) {
    const result = results.find(r => r.model === overAnalyzer.model);
    // Count consecutive zero-revenue days
    let maxConsecutiveZero = 0;
    let currentStreak = 0;
    if (result) {
      for (const d of result.days) {
        if (d.settlement.revenue === 0) {
          currentStreak++;
          maxConsecutiveZero = Math.max(maxConsecutiveZero, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
    }

    cases.push({
      icon: "\u{1F9CA}",
      title: "Analysis Paralysis",
      model: overAnalyzer.displayName,
      narrative: `Spent the majority of tool calls on information gathering rather than action. With an info-to-action ratio of ${overAnalyzer.infoActionRatio.toFixed(1)}:1, this model researched endlessly while the store ran out of stock. ${maxConsecutiveZero > 0 ? `Had ${maxConsecutiveZero} consecutive zero-revenue days.` : ""}`,
      stats: [
        { label: "estimate_order calls", value: `${overAnalyzer.estimateOrderCalls}` },
        { label: "purchase_goods calls", value: `${overAnalyzer.purchaseCalls}` },
        { label: "Info/Action Ratio", value: `${overAnalyzer.infoActionRatio.toFixed(1)}:1` },
        { label: "Net Profit", value: formatYen(overAnalyzer.netProfit) },
      ],
      accentColor: "#f97316",
    });
  }

  // Case 2: Price Crash — model with biggest avg daily revenue drop in last 5 days
  const collapseScores = analyses.map(m => {
    const result = results.find(r => r.model === m.model);
    if (!result) return { ...m, dropRatio: 0, earlyAvg: 0, lateAvg: 0 };
    const earlyAvg = result.days.slice(0, 25).reduce((s, d) => s + d.settlement.revenue, 0) / 25;
    const lateAvg = result.days.slice(25).reduce((s, d) => s + d.settlement.revenue, 0) / 5;
    const dropRatio = earlyAvg > 0 ? lateAvg / earlyAvg : 1;
    return { ...m, dropRatio, earlyAvg, lateAvg };
  }).filter(m => m.earlyAvg > 100); // Only consider models with meaningful early revenue
  collapseScores.sort((a, b) => a.dropRatio - b.dropRatio);
  const lateCollapser = collapseScores[0]?.dropRatio < 0.5 ? collapseScores[0] : null;
  if (lateCollapser) {
    cases.push({
      icon: "\u{1F4C9}",
      title: "Late-Game Collapse",
      model: lateCollapser.displayName,
      narrative: `Revenue collapsed in the final 5 days. Average daily revenue dropped from ${formatYen(lateCollapser.earlyAvg)} (Day 1-25) to ${formatYen(lateCollapser.lateAvg)} (Day 26-30), a ${((1 - lateCollapser.dropRatio) * 100).toFixed(0)}% decline suggesting inventory exhaustion or failed clearance.`,
      stats: [
        { label: "Early Avg Revenue/Day", value: formatYen(lateCollapser.earlyAvg) },
        { label: "Late Avg Revenue/Day", value: formatYen(lateCollapser.lateAvg) },
        { label: "Price Changes", value: `${lateCollapser.setPriceCalls}` },
        { label: "Net Profit", value: formatYen(lateCollapser.netProfit) },
      ],
      accentColor: "#ef4444",
    });
  }

  // Case 3: Lazy Pricer — very few price adjustments
  const lazyPricer = [...analyses]
    .filter(m => m.setPriceCalls < 10 && m.netProfit < 0)
    .sort((a, b) => a.setPriceCalls - b.setPriceCalls)[0];
  if (lazyPricer) {
    cases.push({
      icon: "\u{1F634}",
      title: "The Non-Adjuster",
      model: lazyPricer.displayName,
      narrative: `Made only ${lazyPricer.setPriceCalls} price changes across 30 days. While diligently performing other tasks (${lazyPricer.totalToolCalls} total tool calls), this model never learned that dynamic pricing is the key lever for profitability.`,
      stats: [
        { label: "Price Changes", value: `${lazyPricer.setPriceCalls}` },
        { label: "Total Tool Calls", value: `${lazyPricer.totalToolCalls}` },
        { label: "Zero-Revenue Days", value: `${lazyPricer.zeroRevenueDays}` },
        { label: "Net Profit", value: formatYen(lazyPricer.netProfit) },
      ],
      accentColor: "#f59e0b",
    });
  }

  // Fallback if we don't have 3 case studies
  if (cases.length === 0) {
    const worst = [...analyses].sort((a, b) => a.netProfit - b.netProfit)[0];
    cases.push({
      icon: "\u{26A0}\u{FE0F}",
      title: "Lowest Performer",
      model: worst.displayName,
      narrative: `The lowest-performing model with ${formatYen(worst.netProfit)} net profit. With ${worst.setPriceCalls} price changes and ${worst.zeroRevenueDays} zero-revenue days, fundamental operational gaps prevented profitability.`,
      stats: [
        { label: "Net Profit", value: formatYen(worst.netProfit) },
        { label: "Price Changes", value: `${worst.setPriceCalls}` },
        { label: "Zero-Revenue Days", value: `${worst.zeroRevenueDays}` },
      ],
      accentColor: "#ef4444",
    });
  }

  return cases;
}

/* ─── Deep Dive Reports ─── */

type CategoryKey = "info" | "operation" | "personnel" | "finance" | "strategy";

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  info: "Information",
  operation: "Operations",
  personnel: "Personnel",
  finance: "Finance",
  strategy: "Strategy",
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function normalizeTo100(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  if (Math.abs(max - min) < 1e-9) return 50;
  return Math.round(((value - min) / (max - min)) * 100);
}

function getCallsByCategory(dm: DerivedMetrics): Record<CategoryKey, number> {
  const counts: Record<CategoryKey, number> = {
    info: 0,
    operation: 0,
    personnel: 0,
    finance: 0,
    strategy: 0,
  };

  for (const [toolName, count] of Object.entries(dm.callsByType)) {
    const category = getToolCategory(toolName);
    if (category in counts) {
      counts[category as CategoryKey] += count;
    } else {
      counts.info += count;
    }
  }

  return counts;
}

function topToolsText(dm: DerivedMetrics): string {
  const topTools = Object.entries(dm.callsByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${getToolLabel(name)} (${count})`);

  return topTools.length > 0 ? topTools.join(", ") : "No significant tool usage recorded";
}

function getPhaseActionCounts(result: SimulationResult) {
  const counts = {
    early: { setPrice: 0, purchase: 0, promotion: 0 },
    mid: { setPrice: 0, purchase: 0, promotion: 0 },
    late: { setPrice: 0, purchase: 0, promotion: 0 },
  };

  for (const day of result.days) {
    const phase = day.day <= 10 ? "early" : day.day <= 20 ? "mid" : "late";
    for (const call of day.toolCalls) {
      if (call.name === "set_price") counts[phase].setPrice += 1;
      if (call.name === "purchase_goods") counts[phase].purchase += 1;
      if (call.name === "run_promotion") counts[phase].promotion += 1;
    }
  }

  return counts;
}

function getPhaseMetrics(result: SimulationResult) {
  const metrics = {
    early: { revenue: 0, profit: 0, toolCalls: 0, errors: 0, zeroRevenueDays: 0 },
    mid: { revenue: 0, profit: 0, toolCalls: 0, errors: 0, zeroRevenueDays: 0 },
    late: { revenue: 0, profit: 0, toolCalls: 0, errors: 0, zeroRevenueDays: 0 },
  };

  for (const day of result.days) {
    const phase = day.day <= 10 ? "early" : day.day <= 20 ? "mid" : "late";
    metrics[phase].revenue += day.settlement.revenue;
    metrics[phase].profit += day.settlement.netProfit;
    metrics[phase].toolCalls += day.toolCalls.length;
    metrics[phase].errors += day.toolCalls.filter(tc => {
      return typeof tc.result === "object" && tc.result !== null && "error" in (tc.result as Record<string, unknown>);
    }).length;
    if (day.settlement.revenue === 0) metrics[phase].zeroRevenueDays += 1;
  }

  return metrics;
}

function getBestAndWorstDay(result: SimulationResult) {
  const fallback = { day: 1, profit: 0, revenue: 0 };
  if (result.days.length === 0) return { best: fallback, worst: fallback };

  let best = {
    day: result.days[0].day,
    profit: result.days[0].settlement.netProfit,
    revenue: result.days[0].settlement.revenue,
  };
  let worst = { ...best };

  for (const day of result.days) {
    const profit = day.settlement.netProfit;
    if (profit > best.profit) {
      best = { day: day.day, profit, revenue: day.settlement.revenue };
    }
    if (profit < worst.profit) {
      worst = { day: day.day, profit, revenue: day.settlement.revenue };
    }
  }

  return { best, worst };
}

function buildDeepDiveReports({
  results,
  analyses,
  derivedMetrics,
  strategyByModel,
}: {
  results: SimulationResult[];
  analyses: ModelAnalysis[];
  derivedMetrics: DerivedMetrics[];
  strategyByModel: Map<string, StrategyType>;
}): DeepDiveReport[] {
  const scoreValues = results.map(r => r.finalScore);
  const revenueValues = analyses.map(a => a.totalRevenue);
  const marginValues = analyses.map(a => a.grossMargin);
  const reliabilityValues = analyses.map(a => 1 - a.errorRate);
  const pricingValues = analyses.map(a => a.setPriceCalls);
  const profitableValues = analyses.map(a => a.profitableDays);

  const scoreMin = Math.min(...scoreValues);
  const scoreMax = Math.max(...scoreValues);
  const revenueMin = Math.min(...revenueValues);
  const revenueMax = Math.max(...revenueValues);
  const marginMin = Math.min(...marginValues);
  const marginMax = Math.max(...marginValues);
  const reliabilityMin = Math.min(...reliabilityValues);
  const reliabilityMax = Math.max(...reliabilityValues);
  const pricingMin = Math.min(...pricingValues);
  const pricingMax = Math.max(...pricingValues);
  const profitableMin = Math.min(...profitableValues);
  const profitableMax = Math.max(...profitableValues);

  const medianMargin = median(marginValues);
  const medianErrorRate = median(analyses.map(a => a.errorRate));
  const medianPricing = median(pricingValues);
  const medianZeroRevenueDays = median(analyses.map(a => a.zeroRevenueDays));

  return analyses.map((analysis, idx) => {
    const result = results[idx];
    const dm = derivedMetrics[idx];
    const strategyType = strategyByModel.get(analysis.model) ?? "balanced";
    const strategyTitle = STRATEGY_META[strategyType].title;
    const strategyNarrative = STRATEGY_SUMMARIES[strategyType];

    const referenceIdx = idx === 0 ? Math.min(1, analyses.length - 1) : 0;
    const referenceAnalysis = analyses[referenceIdx];
    const referenceResult = results[referenceIdx];
    const referenceDm = derivedMetrics[referenceIdx];
    const hasReferencePeer = analyses.length > 1 && referenceIdx !== idx;

    const modelKey = analysis.displayName;
    const referenceName = hasReferencePeer
      ? referenceAnalysis.displayName
      : `${analysis.displayName} Baseline`;
    const referenceKey = referenceName;

    const callsByCategory = getCallsByCategory(dm);
    const referenceCallsByCategory = getCallsByCategory(referenceDm);
    const infoShare = analysis.totalToolCalls > 0 ? callsByCategory.info / analysis.totalToolCalls : 0;
    const actionShare = 1 - infoShare;
    const phaseActions = getPhaseActionCounts(result);
    const phaseMetrics = getPhaseMetrics(result);
    const { best, worst } = getBestAndWorstDay(result);

    const promotionCalls = dm.callsByType["run_promotion"] ?? 0;
    const hiringCalls = dm.callsByType["hire_employee"] ?? 0;
    const loanCalls = (dm.callsByType["take_loan"] ?? 0) + (dm.callsByType["repay_loan"] ?? 0);

    const executiveSummary =
      `${analysis.displayName} finished rank #${idx + 1} with ${formatYen(result.finalScore)} in 30-Day Net Cash. ` +
      `It generated ${formatYen(analysis.totalRevenue)} total revenue at ${formatPct(analysis.grossMargin)} gross margin, ` +
      `while executing ${analysis.totalToolCalls} tool calls with a ${formatPct(analysis.errorRate)} tool call error rate.`;

    const operatingStyle =
      `Operating style: ${strategyTitle}. ${strategyNarrative} ` +
      `In this run, ${analysis.displayName} allocated ${formatPct(infoShare)} of calls to information gathering ` +
      `and ${formatPct(actionShare)} to execution actions, with ${analysis.setPriceCalls} pricing updates and ${analysis.purchaseCalls} purchase attempts.`;

    const actionHighlights = [
      `Most-used tools: ${topToolsText(dm)}.`,
      `Action mix: ${analysis.setPriceCalls} set_price, ${analysis.purchaseCalls} purchase_goods, ${promotionCalls} run_promotion, ${hiringCalls} hire_employee, ${loanCalls} finance calls.`,
      `Pacing by phase (early/mid/late): set_price ${phaseActions.early.setPrice}/${phaseActions.mid.setPrice}/${phaseActions.late.setPrice}, purchases ${phaseActions.early.purchase}/${phaseActions.mid.purchase}/${phaseActions.late.purchase}, promotions ${phaseActions.early.promotion}/${phaseActions.mid.promotion}/${phaseActions.late.promotion}.`,
      `Operational stability: ${analysis.profitableDays} profitable days, ${analysis.zeroRevenueDays} zero-revenue days, best day D${best.day} (${formatYen(best.profit)}), worst day D${worst.day} (${formatYen(worst.profit)}).`,
    ];

    const strengths: string[] = [];
    if (result.finalScore > 0) strengths.push(`Finished with positive 30-Day Net Cash (${formatYen(result.finalScore)}), indicating successful cash conversion.`);
    if (analysis.grossMargin >= medianMargin) strengths.push(`Gross margin (${formatPct(analysis.grossMargin)}) is above or near cohort median (${formatPct(medianMargin)}).`);
    if (analysis.errorRate <= medianErrorRate) strengths.push(`Tool execution reliability is solid with ${formatPct(analysis.errorRate)} error rate (median: ${formatPct(medianErrorRate)}).`);
    if (analysis.zeroRevenueDays <= medianZeroRevenueDays) strengths.push(`Maintained fewer zero-revenue days (${analysis.zeroRevenueDays}) than typical peers.`);
    if (analysis.setPriceCalls >= medianPricing) strengths.push(`Used pricing as an active lever (${analysis.setPriceCalls} set_price calls, median: ${medianPricing.toFixed(0)}).`);
    if (strengths.length === 0) strengths.push("No dominant advantage surfaced; performance came from moderate execution across multiple dimensions.");

    const weaknesses: string[] = [];
    if (result.finalScore <= 0) weaknesses.push(`Ended below break-even with ${formatYen(result.finalScore)} 30-Day Net Cash.`);
    if (analysis.errorRate > medianErrorRate) weaknesses.push(`Tool Call Error Rate (${formatPct(analysis.errorRate)}) is above median (${formatPct(medianErrorRate)}), causing execution leakage.`);
    if (analysis.zeroRevenueDays > medianZeroRevenueDays) weaknesses.push(`High zero-revenue exposure (${analysis.zeroRevenueDays} days) indicates stockout or demand conversion issues.`);
    if (analysis.setPriceCalls < medianPricing) weaknesses.push(`Pricing cadence is below median (${analysis.setPriceCalls} vs ${medianPricing.toFixed(0)}), reducing adaptability.`);
    if (analysis.infoActionRatio > 3) weaknesses.push(`Info-to-action ratio (${analysis.infoActionRatio.toFixed(1)}:1) suggests analysis-heavy behavior with delayed execution.`);
    if (weaknesses.length === 0) weaknesses.push("No severe operational weakness identified in this run.");

    const successReasons: string[] = [];
    if (analysis.setPriceCalls >= medianPricing) successReasons.push("Frequent pricing updates improved demand capture and protected margin under changing conditions.");
    if (analysis.errorRate <= medianErrorRate) successReasons.push("Lower execution errors preserved action effectiveness and reduced wasted turns.");
    if (analysis.zeroRevenueDays <= medianZeroRevenueDays) successReasons.push("Fewer zero-revenue days helped maintain steady cash inflow throughout the month.");
    if (analysis.totalRevenue > referenceAnalysis.totalRevenue) successReasons.push(`Revenue outperformed ${referenceAnalysis.displayName} by ${formatYen(analysis.totalRevenue - referenceAnalysis.totalRevenue)}.`);
    if (successReasons.length === 0) successReasons.push("Primary success signals were limited; gains came from incremental execution rather than one decisive edge.");

    const failureReasons: string[] = [];
    if (analysis.totalRevenue < referenceAnalysis.totalRevenue) failureReasons.push(`Revenue trailed ${referenceAnalysis.displayName} by ${formatYen(referenceAnalysis.totalRevenue - analysis.totalRevenue)}.`);
    if (analysis.grossMargin < referenceAnalysis.grossMargin) failureReasons.push(`Margin lagged benchmark by ${((referenceAnalysis.grossMargin - analysis.grossMargin) * 100).toFixed(1)} points.`);
    if (analysis.errorRate > referenceAnalysis.errorRate) failureReasons.push(`Error rate was ${((analysis.errorRate - referenceAnalysis.errorRate) * 100).toFixed(1)} points higher than benchmark.`);
    if (analysis.zeroRevenueDays > referenceAnalysis.zeroRevenueDays) failureReasons.push(`More zero-revenue days (${analysis.zeroRevenueDays} vs ${referenceAnalysis.zeroRevenueDays}) reduced compounding cash flow.`);
    if (failureReasons.length === 0) failureReasons.push("No major structural failure observed relative to the reference model.");

    const relationLabel = hasReferencePeer ? (idx === 0 ? "vs Runner-up" : "vs Top Model") : "Single Model Run";
    const comparisonNarrative = hasReferencePeer
      ? `${analysis.displayName} is ${formatYen(result.finalScore - referenceResult.finalScore)} away from ${referenceAnalysis.displayName} in 30-Day Net Cash. ` +
        `The gap combines revenue (${formatYen(analysis.totalRevenue - referenceAnalysis.totalRevenue)}), margin (${((analysis.grossMargin - referenceAnalysis.grossMargin) * 100).toFixed(1)} pts), and tool reliability (${((analysis.errorRate - referenceAnalysis.errorRate) * 100).toFixed(1)} pts error-rate delta).`
      : "Only one model is available in this run, so comparative benchmarking is not available yet.";

    const chapters = [
      {
        title: "Opening Setup",
        dayRange: "Day 1-10",
        thesis:
          phaseMetrics.early.profit >= 0
            ? `The model established a viable opening with ${formatYen(phaseMetrics.early.revenue)} revenue and ${formatYen(phaseMetrics.early.profit)} net profit in the first 10 days.`
            : `The opening was unstable: despite ${formatYen(phaseMetrics.early.revenue)} revenue, the model ended Day 1-10 at ${formatYen(phaseMetrics.early.profit)} net profit.`,
        bullets: [
          `Core actions: ${phaseActions.early.purchase} purchases, ${phaseActions.early.setPrice} pricing changes, ${phaseActions.early.promotion} promotions.`,
          `Execution load: ${phaseMetrics.early.toolCalls} tool calls with ${(phaseMetrics.early.errors / Math.max(1, phaseMetrics.early.toolCalls) * 100).toFixed(1)}% phase error rate.`,
          `Demand continuity: ${phaseMetrics.early.zeroRevenueDays} zero-revenue days.`,
        ],
        evidence:
          `Best day in full run occurred on D${best.day} (${formatYen(best.profit)}), worst on D${worst.day} (${formatYen(worst.profit)}).`,
      },
      {
        title: "Mid-Run Optimization",
        dayRange: "Day 11-20",
        thesis:
          phaseMetrics.mid.profit >= 0
            ? `Mid-run decisions compounded positively, producing ${formatYen(phaseMetrics.mid.profit)} profit in Days 11-20.`
            : `Mid-run failed to stabilize profitability, with ${formatYen(phaseMetrics.mid.profit)} profit during Days 11-20.`,
        bullets: [
          `Pricing cadence shifted to ${phaseActions.mid.setPrice} updates in this phase.`,
          `Procurement + promotion balance: ${phaseActions.mid.purchase} purchase calls and ${phaseActions.mid.promotion} promotions.`,
          `Tool throughput stayed at ${phaseMetrics.mid.toolCalls} calls; zero-revenue days: ${phaseMetrics.mid.zeroRevenueDays}.`,
        ],
        evidence: `Gross margin at run level is ${formatPct(analysis.grossMargin)}, with overall Tool Call Error Rate at ${formatPct(analysis.errorRate)}.`,
      },
      {
        title: "Endgame Execution",
        dayRange: "Day 21-30",
        thesis:
          phaseMetrics.late.profit >= 0
            ? `The model closed with resilient endgame execution and ${formatYen(phaseMetrics.late.profit)} late-phase profit.`
            : `Late phase dragged results down: Days 21-30 produced ${formatYen(phaseMetrics.late.profit)} net profit.`,
        bullets: [
          `Late actions: ${phaseActions.late.purchase} purchases, ${phaseActions.late.setPrice} pricing changes, ${phaseActions.late.promotion} promotions.`,
          `Cash conversion pressure: ${phaseMetrics.late.zeroRevenueDays} zero-revenue days in the final 10-day window.`,
          `Final phase execution quality: ${(phaseMetrics.late.errors / Math.max(1, phaseMetrics.late.toolCalls) * 100).toFixed(1)}% error rate (${phaseMetrics.late.errors}/${phaseMetrics.late.toolCalls}).`,
        ],
        evidence: `Run finished at ${formatYen(result.finalScore)} net cash after 30 days, versus ${formatYen(referenceResult.finalScore)} for ${referenceAnalysis.displayName}.`,
      },
    ];

    const trendData: Record<string, string | number>[] = [];
    let modelCum = 0;
    let referenceCum = 0;
    const days = Math.max(result.metrics.dailyProfitTrend.length, referenceResult.metrics.dailyProfitTrend.length);
    for (let day = 0; day < days; day++) {
      modelCum += result.metrics.dailyProfitTrend[day] ?? 0;
      referenceCum += referenceResult.metrics.dailyProfitTrend[day] ?? 0;
      trendData.push({
        day: day + 1,
        [modelKey]: Math.round(modelCum),
        [referenceKey]: Math.round(referenceCum),
      });
    }

    const radarData: Record<string, string | number>[] = [
      {
        metric: "Net Cash",
        [modelKey]: normalizeTo100(result.finalScore, scoreMin, scoreMax),
        [referenceKey]: normalizeTo100(referenceResult.finalScore, scoreMin, scoreMax),
      },
      {
        metric: "Revenue",
        [modelKey]: normalizeTo100(analysis.totalRevenue, revenueMin, revenueMax),
        [referenceKey]: normalizeTo100(referenceAnalysis.totalRevenue, revenueMin, revenueMax),
      },
      {
        metric: "Gross Margin",
        [modelKey]: normalizeTo100(analysis.grossMargin, marginMin, marginMax),
        [referenceKey]: normalizeTo100(referenceAnalysis.grossMargin, marginMin, marginMax),
      },
      {
        metric: "Tool Reliability",
        [modelKey]: normalizeTo100(1 - analysis.errorRate, reliabilityMin, reliabilityMax),
        [referenceKey]: normalizeTo100(1 - referenceAnalysis.errorRate, reliabilityMin, reliabilityMax),
      },
      {
        metric: "Pricing Activity",
        [modelKey]: normalizeTo100(analysis.setPriceCalls, pricingMin, pricingMax),
        [referenceKey]: normalizeTo100(referenceAnalysis.setPriceCalls, pricingMin, pricingMax),
      },
      {
        metric: "Profitable Days",
        [modelKey]: normalizeTo100(analysis.profitableDays, profitableMin, profitableMax),
        [referenceKey]: normalizeTo100(referenceAnalysis.profitableDays, profitableMin, profitableMax),
      },
    ];

    const toolMixData: Record<string, string | number>[] = (Object.keys(CATEGORY_LABELS) as CategoryKey[]).map(cat => ({
      category: CATEGORY_LABELS[cat],
      [modelKey]: callsByCategory[cat],
      [referenceKey]: referenceCallsByCategory[cat],
    }));

    return {
      modelId: analysis.model,
      displayName: analysis.displayName,
      rank: idx + 1,
      strategyTitle,
      executiveSummary,
      operatingStyle,
      actionHighlights,
      strengths,
      weaknesses,
      successReasons,
      failureReasons,
      comparisonNarrative,
      snapshot: {
        netCash: result.finalScore,
        totalRevenue: analysis.totalRevenue,
        grossMargin: analysis.grossMargin,
        toolErrorRate: analysis.errorRate,
        toolCalls: analysis.totalToolCalls,
        zeroRevenueDays: analysis.zeroRevenueDays,
        profitableDays: analysis.profitableDays,
      },
      comparison: {
        relationLabel,
        referenceName,
        netCashDiff: result.finalScore - referenceResult.finalScore,
        revenueDiff: analysis.totalRevenue - referenceAnalysis.totalRevenue,
        marginDiff: analysis.grossMargin - referenceAnalysis.grossMargin,
        errorRateDiff: analysis.errorRate - referenceAnalysis.errorRate,
      },
      charts: {
        trendData,
        radarData,
        toolMixData,
      },
      chapters,
      chartKeys: {
        model: modelKey,
        reference: referenceKey,
      },
      colors: {
        model: analysis.color,
        reference: referenceAnalysis.color,
      },
    };
  });
}
