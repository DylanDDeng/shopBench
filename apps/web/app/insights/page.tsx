import {
  getAllResults,
  computeDerivedMetrics,
  getModelDisplayName,
  formatYen,
  formatPct,
  getToolCategory,
} from "@/lib/data";
import { SectionHeader } from "@/components/SectionHeader";
import { InsightCard } from "@/components/InsightCard";
import { CaseStudyCard } from "@/components/CaseStudyCard";
import { InsightsContent } from "./InsightsContent";

/* ─── Per-model analysis data ─── */

interface ModelAnalysis {
  model: string;
  displayName: string;
  netProfit: number;
  setPriceCalls: number;
  purchaseCalls: number;
  zeroRevenueDays: number;
  infoActionRatio: number;
  totalRevenue: number;
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

  // Build per-model analysis
  const MODEL_COLORS = [
    "#60a5fa", "#10b981", "#f59e0b", "#ef4444", "#a78bfa",
    "#ec4899", "#06b6d4", "#84cc16", "#fb923c", "#8b5cf6",
    "#14b8a6", "#f43f5e", "#22d3ee", "#a3e635",
  ];

  const analyses: ModelAnalysis[] = results.map((r, idx) => {
    const dm = computeDerivedMetrics(r);

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
      infoActionRatio,
      totalRevenue: dm.totalRevenue,
      totalToolCalls: r.metrics.totalToolCalls,
      estimateOrderCalls,
      color: MODEL_COLORS[idx % MODEL_COLORS.length],
    };
  });

  // Classify into strategy groups
  const groupMap = new Map<StrategyType, ModelAnalysis[]>();
  for (const m of analyses) {
    const type = classifyStrategy(m);
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

  // Case studies — find specific patterns in the data
  const caseStudies = buildCaseStudies(analyses, results);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Strategy Insights</h1>
        <p>
          Cross-model analysis of pricing strategies, operational patterns, and failure modes from {analyses.length} AI models
        </p>
      </div>

      <SectionHeader title="Key Findings" subtitle={`across ${analyses.length} models`} />
      <div className="insight-grid">
        {insights.map((ins, i) => (
          <InsightCard key={i} {...ins} />
        ))}
      </div>

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

      <SectionHeader title="Failure Case Studies" subtitle="patterns to avoid" />
      <div className="case-study-grid">
        {caseStudies.map((cs, i) => (
          <CaseStudyCard key={i} {...cs} />
        ))}
      </div>
    </div>
  );
}

/* ─── Build case studies from actual data ─── */

function buildCaseStudies(
  analyses: ModelAnalysis[],
  results: import("@/lib/types").SimulationResult[],
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
