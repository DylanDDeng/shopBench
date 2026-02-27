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
import { ModelDiagnosticsPanel } from "./ModelDiagnosticsPanel";
import type { DerivedMetrics, SimulationResult } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

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

interface DiagnosticDay {
  day: number;
  title: string;
  reason: string;
  actions: string;
  impact: string;
  severity: "high" | "medium" | "low";
}

interface ModelDiagnostic {
  model: string;
  displayName: string;
  rank: number;
  netCash: number;
  grossMargin: number;
  whyMarginPositive: string;
  didWell: string[];
  didPoorly: string[];
  criticalDays: DiagnosticDay[];
}

/* ─── Strategy classification ─── */

const STRATEGY_META: Record<StrategyType, { color: string; emoji: string; title: string }> = {
  aggressive: { color: "#10b981", emoji: "\u{1F7E2}", title: "Aggressive Growth" },
  balanced: { color: "#60a5fa", emoji: "\u{1F535}", title: "Balanced Operators" },
  conservative: { color: "#f59e0b", emoji: "\u{1F7E1}", title: "Conservative Observers" },
  "over-analyzer": { color: "#f97316", emoji: "\u{1F7E0}", title: "Over-Analyzers" },
  passive: { color: "#ef4444", emoji: "\u{1F534}", title: "Passive Strugglers" },
};

const STRATEGY_META_ZH: Record<StrategyType, { color: string; emoji: string; title: string }> = {
  aggressive: { color: "#10b981", emoji: "\u{1F7E2}", title: "激进增长型" },
  balanced: { color: "#60a5fa", emoji: "\u{1F535}", title: "均衡运营型" },
  conservative: { color: "#f59e0b", emoji: "\u{1F7E1}", title: "保守观察型" },
  "over-analyzer": { color: "#f97316", emoji: "\u{1F7E0}", title: "过度分析型" },
  passive: { color: "#ef4444", emoji: "\u{1F534}", title: "被动失速型" },
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

const STRATEGY_SUMMARIES_ZH: Record<StrategyType, string> = {
  aggressive:
    "这类模型高频调价、积极补货并配合促销，把价格当作日常优化杠杆。30 天内会进行 50-100+ 次调价，通常能带来更高收入与更稳定利润。",
  balanced:
    "这类模型采用中等频率调价与稳定运营节奏，在竞争性和执行成本之间取得平衡。采购和促销动作相对克制且有规律。",
  conservative:
    "这类模型调价极少，倾向依赖默认策略和最小化干预，容易错过动态定价带来的收益机会。采购频率较低但执行较规整。",
  "over-analyzer":
    "典型“分析瘫痪”模式：大量调用信息工具而缺少执行动作。信息/行动比过高（>3:1）会导致研究很多、行动很少，最终出现缺货和收入停滞。",
  passive:
    "这类模型在门店经营基本机制上表现薄弱。采购不足、定价动作稀少、零收入天数偏多，说明基础运营无法稳定维持。",
};

/* ─── Page component ─── */

export default function InsightsPage({ locale = "en" }: { locale?: Locale }) {
  const isZh = locale === "zh";
  const strategyMeta = isZh ? STRATEGY_META_ZH : STRATEGY_META;
  const strategySummaries = isZh ? STRATEGY_SUMMARIES_ZH : STRATEGY_SUMMARIES;
  const results = getAllResults();

  if (results.length === 0) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>{isZh ? "策略洞察" : "Strategy Insights"}</h1>
          <p>{isZh ? "暂无可分析结果，请先运行 benchmark。" : "No simulation results available. Run benchmarks first to see insights."}</p>
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
      const meta = strategyMeta[type];
      return {
        type,
        ...meta,
        models,
        summary: strategySummaries[type],
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
      label: isZh ? "盈利模型占比" : "Profitability Rate",
      description: isZh
        ? `${analyses.length} 个模型中仅有 ${profitableCount} 个在 30 天内实现正利润`
        : `Only ${profitableCount} of ${analyses.length} models achieved positive profit over 30 days`,
    },
    {
      icon: "\u{1F4C8}",
      value: `r = ${priceR.toFixed(2)}`,
      label: isZh ? "调价频率 \u{2194} 利润" : "Price Changes \u{2194} Profit",
      description: isZh
        ? "跨模型看，调价频率与净利润呈显著正相关"
        : "Strong correlation between pricing frequency and net profit across all models",
    },
    {
      icon: "\u{26A0}\u{FE0F}",
      value: formatYen(highestRevModel.totalRevenue),
      label: isZh ? "收入 \u{2260} 利润" : "Revenue \u{2260} Profit",
      description: isZh
        ? `${highestRevModel.displayName} 收入最高，但${highestRevModel.displayName === highestProfitModel.displayName ? "也同时是利润最高" : `${highestProfitModel.displayName} 的利润更高`}`
        : `${highestRevModel.displayName} had highest revenue but ${highestRevModel.displayName === highestProfitModel.displayName ? "also topped profit" : `${highestProfitModel.displayName} was more profitable`}`,
    },
    {
      icon: "\u{2696}\u{FE0F}",
      value: `${avgInfoRatioProfitable.toFixed(1)}:1`,
      label: isZh ? "最优 信息/行动 比" : "Optimal Info/Action Ratio",
      description: isZh
        ? "盈利模型的平均信息/行动比；过高通常意味着“分析瘫痪”"
        : "Average info-to-action ratio among profitable models \u{2014} too high means analysis paralysis",
    },
    {
      icon: "\u{1F9E0}",
      value: `#1 vs #${sortedByProfit.length}`,
      label: isZh ? "参数规模 \u{2260} 表现" : "Size \u{2260} Performance",
      description: isZh
        ? `${bestModel.displayName} 明显优于 ${worstModel.displayName}，更大的模型不一定更好`
        : `${bestModel.displayName} outperformed ${worstModel.displayName} \u{2014} bigger models aren't always better`,
    },
  ];
  const strongestGroup = [...strategyGroups].sort((a, b) => b.avgNetProfit - a.avgNetProfit)[0];
  const largestGroup = [...strategyGroups].sort((a, b) => b.models.length - a.models.length)[0];

  // Case studies — find specific patterns in the data
  const caseStudies = buildCaseStudies(analyses, results, locale);
  const deepDiveReports = buildDeepDiveReports({
    results,
    analyses,
    derivedMetrics,
    strategyByModel,
    locale,
    strategyMeta,
    strategySummaries,
  });
  const modelDiagnostics = buildModelDiagnostics({
    analyses,
    results,
    derivedMetrics,
    locale,
  });

  return (
    <div className="container">
      <div className="page-header">
        <h1>{isZh ? "策略洞察" : "Strategy Insights"}</h1>
        <p>
          {isZh
            ? `基于 ${analyses.length} 个 AI 模型，对定价策略、运营模式与失败机制进行跨模型分析`
            : `Cross-model analysis of pricing strategies, operational patterns, and failure modes from ${analyses.length} AI models`}
        </p>
      </div>

      <section className="insights-intro card-flat">
        <div className="insights-intro-kicker">{isZh ? "洞察摘要" : "Insights Brief"}</div>
        <h2 className="insights-intro-title">{isZh ? "胜出模型与落后模型的关键差异" : "What separates winning model operators from struggling ones"}</h2>
        <p className="insights-intro-copy">
          {isZh
            ? "头部模型通常具备高频调价、纪律化采购和较低工具错误率。落后模型往往要么调价动作不足，要么分析过多而执行不足。"
            : "Top performers combine frequent price adjustments with disciplined purchasing and low tool-call failure. Low performers either under-act on pricing or spend too much on analysis without execution."}
        </p>
        <div className="insights-intro-pills">
          <div className="insights-intro-pill">
            <span>{isZh ? "盈利模型数" : "Profitable Models"}</span>
            <strong>{profitableCount} / {analyses.length}</strong>
          </div>
          <div className="insights-intro-pill">
            <span>{isZh ? "最强相关信号" : "Best Correlation Signal"}</span>
            <strong>{isZh ? `调价 ↔ 净现金 (r=${priceR.toFixed(2)})` : `Pricing ↔ Net Cash (r=${priceR.toFixed(2)})`}</strong>
          </div>
          {strongestGroup ? (
            <div className="insights-intro-pill">
              <span>{isZh ? "最强策略簇" : "Strongest Strategy Cluster"}</span>
              <strong>{strongestGroup.title}</strong>
            </div>
          ) : null}
          {largestGroup ? (
            <div className="insights-intro-pill">
              <span>{isZh ? "最大策略簇" : "Largest Strategy Cluster"}</span>
              <strong>{largestGroup.title} ({largestGroup.models.length}{isZh ? " 个模型" : ""})</strong>
            </div>
          ) : null}
        </div>
      </section>

      <section className="insights-block">
        <div className="insights-block-head">
          <h2>{isZh ? "关键发现" : "Key Findings"}</h2>
          <span className="insights-block-subtitle">{isZh ? `覆盖 ${analyses.length} 个模型` : `across ${analyses.length} models`}</span>
        </div>
        <div className="insight-grid insight-grid-premium">
          {insights.map((ins, i) => (
            <InsightCard key={i} {...ins} />
          ))}
        </div>
      </section>

      <InsightsContent
        locale={locale}
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

      <ModelDiagnosticsPanel diagnostics={modelDiagnostics} locale={locale} />

      <section className="insights-block">
        <div className="insights-block-head">
          <h2>{isZh ? "失败案例拆解" : "Failure Case Studies"}</h2>
          <span className="insights-block-subtitle">{isZh ? "应避免的模式" : "patterns to avoid"}</span>
        </div>
        <div className="case-study-grid">
          {caseStudies.map((cs, i) => (
            <CaseStudyCard key={i} {...cs} locale={locale} />
          ))}
        </div>
      </section>

      <SectionHeader
        title={isZh ? "模型深度报告" : "Model Deep Dive Reports"}
        subtitle={isZh ? "按模型输出长篇分析与图表证据" : "long-form per model analysis with chart evidence"}
      />
      <DeepDiveReports reports={deepDiveReports} locale={locale} />
    </div>
  );
}

function buildModelDiagnostics({
  analyses,
  results,
  derivedMetrics,
  locale,
}: {
  analyses: ModelAnalysis[];
  results: SimulationResult[];
  derivedMetrics: DerivedMetrics[];
  locale: Locale;
}): ModelDiagnostic[] {
  const isZh = locale === "zh";
  const medianRevenue = median(analyses.map(a => a.totalRevenue));
  const medianMargin = median(analyses.map(a => a.grossMargin));
  const medianPricing = median(analyses.map(a => a.setPriceCalls));
  const medianError = median(analyses.map(a => a.errorRate));

  return analyses.map((analysis, idx) => {
    const result = results[idx];
    const dm = derivedMetrics[idx];
    const days = result.days;
    const financialHistory = days[days.length - 1]?.stateSnapshot?.financialHistory ?? [];

    let totalRevenue = 0;
    let totalCOGS = 0;
    for (const rec of financialHistory) {
      totalRevenue += rec.revenue;
      totalCOGS += rec.costOfGoods;
    }
    const grossProfit = totalRevenue - totalCOGS;

    let soldQty = 0;
    let totalCustomers = 0;
    let purchaseCost = 0;
    let purchaseQty = 0;
    let promoCalls = 0;
    let promoDiscountSum = 0;
    let marketingSpend = 0;
    let infoCalls = 0;
    let actionCalls = 0;

    const dailyRows: Array<{
      day: number;
      revenue: number;
      netProfit: number;
      cashDelta: number;
      toolErrors: number;
      hasBrokenHoursCall: boolean;
      marketingSpend: number;
      actions: string[];
    }> = [];

    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      const prevCash = i === 0 ? d.stateSnapshot.cash : days[i - 1].stateSnapshot.cash;
      const cashDelta = d.stateSnapshot.cash - prevCash;

      if (typeof d.settlement.customerCount === "number") {
        totalCustomers += d.settlement.customerCount;
      }
      for (const sold of d.settlement.itemsSold) {
        soldQty += sold.quantity;
      }

      let toolErrors = 0;
      let dayMarketingSpend = 0;
      let hasBrokenHoursCall = false;
      const actionSnippets: string[] = [];

      for (const tc of d.toolCalls) {
        const args = tc.arguments as Record<string, unknown>;
        const res = (tc.result && typeof tc.result === "object") ? (tc.result as Record<string, unknown>) : null;
        if (res && "error" in res) {
          toolErrors++;
        }

        const cat = getToolCategory(tc.name);
        if (cat === "info") infoCalls++;
        else actionCalls++;

        if (tc.name === "purchase_goods") {
          const qty = typeof args.quantity === "number" ? args.quantity : 0;
          const cost = res && typeof res.totalCost === "number" ? res.totalCost : 0;
          purchaseQty += qty;
          purchaseCost += cost;
          if (cost > 0) actionSnippets.push(`purchase_goods(¥${Math.round(cost)})`);
        }

        if (tc.name === "set_price") {
          const item = typeof args.item === "string" ? args.item : "item";
          const price = typeof args.price === "number" ? args.price : null;
          if (price !== null) actionSnippets.push(`set_price(${item}→¥${price})`);
        }

        if (tc.name === "run_promotion") {
          promoCalls++;
          const discount = typeof args.discount_pct === "number" ? args.discount_pct : null;
          if (discount !== null) {
            promoDiscountSum += discount;
            actionSnippets.push(`run_promotion(${discount}%)`);
          } else {
            actionSnippets.push("run_promotion");
          }
        }

        if (tc.name === "launch_marketing") {
          const cost = res && typeof res.cost === "number" ? res.cost : 0;
          if (cost > 0) {
            marketingSpend += cost;
            dayMarketingSpend += cost;
            actionSnippets.push(`launch_marketing(¥${Math.round(cost)})`);
          }
        }

        if (tc.name === "adjust_store_hours") {
          const openHour = typeof args.open_hour === "number" ? args.open_hour : null;
          const closeHour = typeof args.close_hour === "number" ? args.close_hour : null;
          const hasValidArgs = openHour !== null && closeHour !== null;
          if (hasValidArgs) {
            actionSnippets.push(`adjust_store_hours(${openHour}-${closeHour})`);
          } else {
            hasBrokenHoursCall = true;
            actionSnippets.push("adjust_store_hours({})");
          }
        }

        if (tc.name === "hire_employee" || tc.name === "fire_employee" || tc.name === "assign_shift") {
          actionSnippets.push(tc.name);
        }
      }

      dailyRows.push({
        day: d.day,
        revenue: d.settlement.revenue,
        netProfit: d.settlement.netProfit,
        cashDelta,
        toolErrors,
        hasBrokenHoursCall,
        marketingSpend: dayMarketingSpend,
        actions: actionSnippets.slice(0, 5),
      });
    }

    const avgSellPrice = soldQty > 0 ? totalRevenue / soldQty : 0;
    const avgPurchaseUnitCost = purchaseQty > 0 ? purchaseCost / purchaseQty : 0;
    const avgPromoDiscount = promoCalls > 0 ? promoDiscountSum / promoCalls : 0;
    const infoActionRatio = actionCalls > 0 ? infoCalls / actionCalls : 0;

    const whyMarginPositive = isZh
      ? `毛利率 ${formatPct(analysis.grossMargin)} 来自“售价-进货成本”差价：平均售出单价约 ¥${avgSellPrice.toFixed(2)}，平均进货单价约 ¥${avgPurchaseUnitCost.toFixed(2)}。同时调价 ${analysis.setPriceCalls} 次、促销 ${promoCalls} 次（平均折扣 ${avgPromoDiscount.toFixed(1)}%）提升了销售差价。`
      : `Gross margin (${formatPct(analysis.grossMargin)}) comes from the spread between selling price and purchase cost: average sold-unit price is ~¥${avgSellPrice.toFixed(2)}, while average purchased-unit cost is ~¥${avgPurchaseUnitCost.toFixed(2)}. It also repriced ${analysis.setPriceCalls} times and used ${promoCalls} promotions (avg ${avgPromoDiscount.toFixed(1)}% discount).`;

    const didWell: string[] = [];
    if (analysis.grossMargin >= medianMargin) {
      didWell.push(isZh
        ? `毛利率高于或接近样本中位数（${formatPct(analysis.grossMargin)} vs ${formatPct(medianMargin)}）。`
        : `Margin is above/near cohort median (${formatPct(analysis.grossMargin)} vs ${formatPct(medianMargin)}).`);
    }
    if (analysis.errorRate <= medianError) {
      didWell.push(isZh
        ? `工具错误率较低（${formatPct(analysis.errorRate)}），执行质量稳定。`
        : `Tool error rate is relatively low (${formatPct(analysis.errorRate)}), indicating stable execution.`);
    }
    if (analysis.setPriceCalls >= medianPricing) {
      didWell.push(isZh
        ? `调价动作活跃（${analysis.setPriceCalls} 次），能及时调整价格策略。`
        : `Pricing cadence is active (${analysis.setPriceCalls} changes), enabling fast strategy adjustments.`);
    }
    if (grossProfit > 0) {
      didWell.push(isZh
        ? `毛利润为正（${formatYen(grossProfit)}），单品交易层面具备盈利能力。`
        : `Gross profit is positive (${formatYen(grossProfit)}), so unit economics are profitable.`);
    }
    if (didWell.length === 0) {
      didWell.push(isZh ? "没有明显强项，表现主要靠平均水平执行。" : "No standout strengths; performance came from average execution.");
    }

    const didPoorly: string[] = [];
    if (analysis.totalRevenue < medianRevenue) {
      didPoorly.push(isZh
        ? `收入规模偏低（${formatYen(analysis.totalRevenue)}，低于中位数 ${formatYen(medianRevenue)}）。`
        : `Revenue scale is low (${formatYen(analysis.totalRevenue)} vs median ${formatYen(medianRevenue)}).`);
    }
    if (analysis.zeroRevenueDays > 0) {
      didPoorly.push(isZh
        ? `出现 ${analysis.zeroRevenueDays} 天零收入，现金流连续性被打断。`
        : `It had ${analysis.zeroRevenueDays} zero-revenue days, breaking cash-flow continuity.`);
    }
    if (marketingSpend > totalRevenue * 0.1) {
      didPoorly.push(isZh
        ? `营销支出偏重（约 ${formatYen(marketingSpend)}，占收入 ${(marketingSpend / Math.max(totalRevenue, 1) * 100).toFixed(1)}%）。`
        : `Marketing spend is heavy (~${formatYen(marketingSpend)}, ${(marketingSpend / Math.max(totalRevenue, 1) * 100).toFixed(1)}% of revenue).`);
    }
    if (result.finalScore <= 0) {
      didPoorly.push(isZh
        ? `30天净现金为负（${formatYen(result.finalScore)}），现金转化未闭环。`
        : `30-Day Net Cash is negative (${formatYen(result.finalScore)}), so cash conversion did not close.`);
    }
    if (infoActionRatio > 2.5) {
      didPoorly.push(isZh
        ? `信息/行动比过高（${infoActionRatio.toFixed(1)}:1），有“看得多做得少”的倾向。`
        : `Info/action ratio is high (${infoActionRatio.toFixed(1)}:1), suggesting analysis-heavy behavior.`);
    }
    if (didPoorly.length === 0) {
      didPoorly.push(isZh ? "未发现明显短板，但仍可提升规模化效率。" : "No major weakness surfaced, but scaling efficiency can still improve.");
    }

    const criticalDays = dailyRows
      .map(day => {
        const reasons: string[] = [];
        let severity = 0;

        if (day.hasBrokenHoursCall) {
          severity += 5;
          reasons.push(isZh ? "营业时间工具调用参数异常" : "Broken store-hours tool call");
        }
        if (day.revenue === 0) {
          severity += 3;
          reasons.push(isZh ? "当日收入为 0" : "Revenue dropped to 0");
        }
        if (day.cashDelta <= -800) {
          severity += 2;
          reasons.push(isZh ? "现金单日大幅下降" : "Large one-day cash drawdown");
        }
        if (day.marketingSpend >= 1000) {
          severity += 2;
          reasons.push(isZh ? "营销支出过高" : "High marketing spend");
        }
        if (day.toolErrors >= 2) {
          severity += 1;
          reasons.push(isZh ? "工具错误集中出现" : "Spike in tool errors");
        }

        return { ...day, severity, reasons };
      })
      .filter(day => day.severity > 0)
      .sort((a, b) => b.severity - a.severity || a.day - b.day)
      .slice(0, 3)
      .map(day => {
        let title = isZh ? "执行异常日" : "Execution Anomaly Day";
        if (day.hasBrokenHoursCall) title = isZh ? "营业时间配置异常" : "Store-Hours Misconfiguration";
        else if (day.revenue === 0) title = isZh ? "零收入日" : "Zero-Revenue Day";
        else if (day.cashDelta <= -800) title = isZh ? "现金急跌日" : "Cash-Drawdown Day";
        const severity: DiagnosticDay["severity"] = day.severity >= 5 ? "high" : day.severity >= 3 ? "medium" : "low";

        return {
          day: day.day,
          title,
          reason: day.reasons.join(isZh ? "；" : "; "),
          actions: day.actions.length > 0 ? day.actions.join(", ") : (isZh ? "无关键动作记录" : "No notable actions recorded"),
          impact: isZh
            ? `收入 ${formatYen(day.revenue)}，净利润 ${formatYen(day.netProfit)}，现金变动 ${formatYen(day.cashDelta)}`
            : `Revenue ${formatYen(day.revenue)}, net profit ${formatYen(day.netProfit)}, cash delta ${formatYen(day.cashDelta)}`,
          severity,
        };
      });

    const fallbackDay = [...dailyRows].sort((a, b) => a.netProfit - b.netProfit)[0];
    const finalCriticalDays = criticalDays.length > 0
      ? criticalDays
      : [{
          day: fallbackDay.day,
          title: isZh ? "最低利润日" : "Lowest-Profit Day",
          reason: isZh ? "当日净利润处于全月最低值。" : "This day had the lowest net profit in the run.",
          actions: fallbackDay.actions.length > 0 ? fallbackDay.actions.join(", ") : (isZh ? "无关键动作记录" : "No notable actions recorded"),
          impact: isZh
            ? `收入 ${formatYen(fallbackDay.revenue)}，净利润 ${formatYen(fallbackDay.netProfit)}，现金变动 ${formatYen(fallbackDay.cashDelta)}`
            : `Revenue ${formatYen(fallbackDay.revenue)}, net profit ${formatYen(fallbackDay.netProfit)}, cash delta ${formatYen(fallbackDay.cashDelta)}`,
          severity: "medium",
        }];

    return {
      model: analysis.model,
      displayName: analysis.displayName,
      rank: idx + 1,
      netCash: result.finalScore,
      grossMargin: analysis.grossMargin,
      whyMarginPositive,
      didWell,
      didPoorly,
      criticalDays: finalCriticalDays,
    };
  });
}

/* ─── Build case studies from actual data ─── */

function buildCaseStudies(
  analyses: ModelAnalysis[],
  results: SimulationResult[],
  locale: Locale,
) {
  const isZh = locale === "zh";
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
      title: isZh ? "分析瘫痪" : "Analysis Paralysis",
      model: overAnalyzer.displayName,
      narrative: isZh
        ? `该模型把大量工具调用用于信息收集而非行动。信息/行动比达到 ${overAnalyzer.infoActionRatio.toFixed(1)}:1，研究很多但执行不足，最终出现缺货。${maxConsecutiveZero > 0 ? `连续 ${maxConsecutiveZero} 天零收入。` : ""}`
        : `Spent the majority of tool calls on information gathering rather than action. With an info-to-action ratio of ${overAnalyzer.infoActionRatio.toFixed(1)}:1, this model researched endlessly while the store ran out of stock. ${maxConsecutiveZero > 0 ? `Had ${maxConsecutiveZero} consecutive zero-revenue days.` : ""}`,
      stats: [
        { label: isZh ? "estimate_order 调用" : "estimate_order calls", value: `${overAnalyzer.estimateOrderCalls}` },
        { label: isZh ? "purchase_goods 调用" : "purchase_goods calls", value: `${overAnalyzer.purchaseCalls}` },
        { label: isZh ? "信息/行动比" : "Info/Action Ratio", value: `${overAnalyzer.infoActionRatio.toFixed(1)}:1` },
        { label: isZh ? "净利润" : "Net Profit", value: formatYen(overAnalyzer.netProfit) },
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
      title: isZh ? "后程崩盘" : "Late-Game Collapse",
      model: lateCollapser.displayName,
      narrative: isZh
        ? `最后 5 天收入明显崩塌：日均收入从 ${formatYen(lateCollapser.earlyAvg)}（Day 1-25）降至 ${formatYen(lateCollapser.lateAvg)}（Day 26-30），下降 ${((1 - lateCollapser.dropRatio) * 100).toFixed(0)}%，可能与缺货或清仓失败有关。`
        : `Revenue collapsed in the final 5 days. Average daily revenue dropped from ${formatYen(lateCollapser.earlyAvg)} (Day 1-25) to ${formatYen(lateCollapser.lateAvg)} (Day 26-30), a ${((1 - lateCollapser.dropRatio) * 100).toFixed(0)}% decline suggesting inventory exhaustion or failed clearance.`,
      stats: [
        { label: isZh ? "前期日均收入" : "Early Avg Revenue/Day", value: formatYen(lateCollapser.earlyAvg) },
        { label: isZh ? "后期日均收入" : "Late Avg Revenue/Day", value: formatYen(lateCollapser.lateAvg) },
        { label: isZh ? "调价次数" : "Price Changes", value: `${lateCollapser.setPriceCalls}` },
        { label: isZh ? "净利润" : "Net Profit", value: formatYen(lateCollapser.netProfit) },
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
      title: isZh ? "不调价者" : "The Non-Adjuster",
      model: lazyPricer.displayName,
      narrative: isZh
        ? `30 天内仅进行了 ${lazyPricer.setPriceCalls} 次调价。尽管执行了其他任务（总计 ${lazyPricer.totalToolCalls} 次工具调用），但未利用“动态定价”这一关键利润杠杆。`
        : `Made only ${lazyPricer.setPriceCalls} price changes across 30 days. While diligently performing other tasks (${lazyPricer.totalToolCalls} total tool calls), this model never learned that dynamic pricing is the key lever for profitability.`,
      stats: [
        { label: isZh ? "调价次数" : "Price Changes", value: `${lazyPricer.setPriceCalls}` },
        { label: isZh ? "总工具调用" : "Total Tool Calls", value: `${lazyPricer.totalToolCalls}` },
        { label: isZh ? "零收入天数" : "Zero-Revenue Days", value: `${lazyPricer.zeroRevenueDays}` },
        { label: isZh ? "净利润" : "Net Profit", value: formatYen(lazyPricer.netProfit) },
      ],
      accentColor: "#f59e0b",
    });
  }

  // Fallback if we don't have 3 case studies
  if (cases.length === 0) {
    const worst = [...analyses].sort((a, b) => a.netProfit - b.netProfit)[0];
    cases.push({
      icon: "\u{26A0}\u{FE0F}",
      title: isZh ? "最低表现模型" : "Lowest Performer",
      model: worst.displayName,
      narrative: isZh
        ? `该模型净利润为 ${formatYen(worst.netProfit)}，表现垫底。调价仅 ${worst.setPriceCalls} 次且有 ${worst.zeroRevenueDays} 天零收入，基础运营缺口导致无法盈利。`
        : `The lowest-performing model with ${formatYen(worst.netProfit)} net profit. With ${worst.setPriceCalls} price changes and ${worst.zeroRevenueDays} zero-revenue days, fundamental operational gaps prevented profitability.`,
      stats: [
        { label: isZh ? "净利润" : "Net Profit", value: formatYen(worst.netProfit) },
        { label: isZh ? "调价次数" : "Price Changes", value: `${worst.setPriceCalls}` },
        { label: isZh ? "零收入天数" : "Zero-Revenue Days", value: `${worst.zeroRevenueDays}` },
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

const CATEGORY_LABELS_ZH: Record<CategoryKey, string> = {
  info: "信息类",
  operation: "运营类",
  personnel: "人力类",
  finance: "财务类",
  strategy: "策略类",
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

function topToolsText(dm: DerivedMetrics, locale: Locale): string {
  const isZh = locale === "zh";
  const topTools = Object.entries(dm.callsByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${getToolLabel(name)} (${count})`);

  return topTools.length > 0 ? topTools.join(", ") : (isZh ? "未记录到显著工具使用" : "No significant tool usage recorded");
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
  locale,
  strategyMeta,
  strategySummaries,
}: {
  results: SimulationResult[];
  analyses: ModelAnalysis[];
  derivedMetrics: DerivedMetrics[];
  strategyByModel: Map<string, StrategyType>;
  locale: Locale;
  strategyMeta: Record<StrategyType, { color: string; emoji: string; title: string }>;
  strategySummaries: Record<StrategyType, string>;
}): DeepDiveReport[] {
  const isZh = locale === "zh";
  const categoryLabels = isZh ? CATEGORY_LABELS_ZH : CATEGORY_LABELS;
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
    const strategyTitle = strategyMeta[strategyType].title;
    const strategyNarrative = strategySummaries[strategyType];

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

    const executiveSummary = isZh
      ? `${analysis.displayName} 在 30 天净现金指标中排名第 #${idx + 1}，最终为 ${formatYen(result.finalScore)}。总收入 ${formatYen(analysis.totalRevenue)}，毛利率 ${formatPct(analysis.grossMargin)}，共执行 ${analysis.totalToolCalls} 次工具调用，错误率 ${formatPct(analysis.errorRate)}。`
      : `${analysis.displayName} finished rank #${idx + 1} with ${formatYen(result.finalScore)} in 30-Day Net Cash. It generated ${formatYen(analysis.totalRevenue)} total revenue at ${formatPct(analysis.grossMargin)} gross margin, while executing ${analysis.totalToolCalls} tool calls with a ${formatPct(analysis.errorRate)} tool call error rate.`;

    const operatingStyle = isZh
      ? `运营风格：${strategyTitle}。${strategyNarrative} 本次运行中，${analysis.displayName} 将 ${formatPct(infoShare)} 的调用用于信息收集，${formatPct(actionShare)} 用于执行动作；共调价 ${analysis.setPriceCalls} 次，发起采购 ${analysis.purchaseCalls} 次。`
      : `Operating style: ${strategyTitle}. ${strategyNarrative} In this run, ${analysis.displayName} allocated ${formatPct(infoShare)} of calls to information gathering and ${formatPct(actionShare)} to execution actions, with ${analysis.setPriceCalls} pricing updates and ${analysis.purchaseCalls} purchase attempts.`;

    const actionHighlights = [
      isZh
        ? `高频工具：${topToolsText(dm, locale)}。`
        : `Most-used tools: ${topToolsText(dm, locale)}.`,
      isZh
        ? `行动结构：set_price ${analysis.setPriceCalls} 次，purchase_goods ${analysis.purchaseCalls} 次，run_promotion ${promotionCalls} 次，hire_employee ${hiringCalls} 次，财务类 ${loanCalls} 次。`
        : `Action mix: ${analysis.setPriceCalls} set_price, ${analysis.purchaseCalls} purchase_goods, ${promotionCalls} run_promotion, ${hiringCalls} hire_employee, ${loanCalls} finance calls.`,
      isZh
        ? `阶段节奏（前/中/后）：set_price ${phaseActions.early.setPrice}/${phaseActions.mid.setPrice}/${phaseActions.late.setPrice}，采购 ${phaseActions.early.purchase}/${phaseActions.mid.purchase}/${phaseActions.late.purchase}，促销 ${phaseActions.early.promotion}/${phaseActions.mid.promotion}/${phaseActions.late.promotion}。`
        : `Pacing by phase (early/mid/late): set_price ${phaseActions.early.setPrice}/${phaseActions.mid.setPrice}/${phaseActions.late.setPrice}, purchases ${phaseActions.early.purchase}/${phaseActions.mid.purchase}/${phaseActions.late.purchase}, promotions ${phaseActions.early.promotion}/${phaseActions.mid.promotion}/${phaseActions.late.promotion}.`,
      isZh
        ? `运营稳定性：盈利天数 ${analysis.profitableDays}，零收入天数 ${analysis.zeroRevenueDays}；最佳日 D${best.day}（${formatYen(best.profit)}），最差日 D${worst.day}（${formatYen(worst.profit)}）。`
        : `Operational stability: ${analysis.profitableDays} profitable days, ${analysis.zeroRevenueDays} zero-revenue days, best day D${best.day} (${formatYen(best.profit)}), worst day D${worst.day} (${formatYen(worst.profit)}).`,
    ];

    const strengths: string[] = [];
    if (result.finalScore > 0) strengths.push(isZh ? `30 天净现金为正（${formatYen(result.finalScore)}），说明现金转化有效。` : `Finished with positive 30-Day Net Cash (${formatYen(result.finalScore)}), indicating successful cash conversion.`);
    if (analysis.grossMargin >= medianMargin) strengths.push(isZh ? `毛利率（${formatPct(analysis.grossMargin)}）高于或接近样本中位数（${formatPct(medianMargin)}）。` : `Gross margin (${formatPct(analysis.grossMargin)}) is above or near cohort median (${formatPct(medianMargin)}).`);
    if (analysis.errorRate <= medianErrorRate) strengths.push(isZh ? `工具执行可靠性较好，错误率 ${formatPct(analysis.errorRate)}（中位数：${formatPct(medianErrorRate)}）。` : `Tool execution reliability is solid with ${formatPct(analysis.errorRate)} error rate (median: ${formatPct(medianErrorRate)}).`);
    if (analysis.zeroRevenueDays <= medianZeroRevenueDays) strengths.push(isZh ? `零收入天数（${analysis.zeroRevenueDays}）低于典型同行。` : `Maintained fewer zero-revenue days (${analysis.zeroRevenueDays}) than typical peers.`);
    if (analysis.setPriceCalls >= medianPricing) strengths.push(isZh ? `将定价作为主动杠杆（set_price ${analysis.setPriceCalls} 次，中位数 ${medianPricing.toFixed(0)}）。` : `Used pricing as an active lever (${analysis.setPriceCalls} set_price calls, median: ${medianPricing.toFixed(0)}).`);
    if (strengths.length === 0) strengths.push(isZh ? "未出现明显单点优势，表现主要来自多维度的中等稳定执行。" : "No dominant advantage surfaced; performance came from moderate execution across multiple dimensions.");

    const weaknesses: string[] = [];
    if (result.finalScore <= 0) weaknesses.push(isZh ? `30 天净现金为负（${formatYen(result.finalScore)}），未达到盈亏平衡。` : `Ended below break-even with ${formatYen(result.finalScore)} 30-Day Net Cash.`);
    if (analysis.errorRate > medianErrorRate) weaknesses.push(isZh ? `工具调用错误率（${formatPct(analysis.errorRate)}）高于中位数（${formatPct(medianErrorRate)}），造成执行损耗。` : `Tool Call Error Rate (${formatPct(analysis.errorRate)}) is above median (${formatPct(medianErrorRate)}), causing execution leakage.`);
    if (analysis.zeroRevenueDays > medianZeroRevenueDays) weaknesses.push(isZh ? `零收入天数较高（${analysis.zeroRevenueDays} 天），存在缺货或需求转化问题。` : `High zero-revenue exposure (${analysis.zeroRevenueDays} days) indicates stockout or demand conversion issues.`);
    if (analysis.setPriceCalls < medianPricing) weaknesses.push(isZh ? `调价频次低于中位数（${analysis.setPriceCalls} vs ${medianPricing.toFixed(0)}），适应性不足。` : `Pricing cadence is below median (${analysis.setPriceCalls} vs ${medianPricing.toFixed(0)}), reducing adaptability.`);
    if (analysis.infoActionRatio > 3) weaknesses.push(isZh ? `信息/行动比过高（${analysis.infoActionRatio.toFixed(1)}:1），表现为分析偏重、执行滞后。` : `Info-to-action ratio (${analysis.infoActionRatio.toFixed(1)}:1) suggests analysis-heavy behavior with delayed execution.`);
    if (weaknesses.length === 0) weaknesses.push(isZh ? "本次运行未识别到显著的结构性短板。" : "No severe operational weakness identified in this run.");

    const successReasons: string[] = [];
    if (analysis.setPriceCalls >= medianPricing) successReasons.push(isZh ? "高频调价提升了需求捕获能力，并在波动环境下更好保护毛利。" : "Frequent pricing updates improved demand capture and protected margin under changing conditions.");
    if (analysis.errorRate <= medianErrorRate) successReasons.push(isZh ? "较低的执行错误率提升了行动有效性，减少了无效回合。" : "Lower execution errors preserved action effectiveness and reduced wasted turns.");
    if (analysis.zeroRevenueDays <= medianZeroRevenueDays) successReasons.push(isZh ? "更少的零收入天数让月内现金流更连续稳定。" : "Fewer zero-revenue days helped maintain steady cash inflow throughout the month.");
    if (analysis.totalRevenue > referenceAnalysis.totalRevenue) successReasons.push(isZh ? `收入领先 ${referenceAnalysis.displayName} ${formatYen(analysis.totalRevenue - referenceAnalysis.totalRevenue)}。` : `Revenue outperformed ${referenceAnalysis.displayName} by ${formatYen(analysis.totalRevenue - referenceAnalysis.totalRevenue)}.`);
    if (successReasons.length === 0) successReasons.push(isZh ? "缺少非常突出的成功信号，收益更多来自渐进式执行而非单点优势。" : "Primary success signals were limited; gains came from incremental execution rather than one decisive edge.");

    const failureReasons: string[] = [];
    if (analysis.totalRevenue < referenceAnalysis.totalRevenue) failureReasons.push(isZh ? `收入落后 ${referenceAnalysis.displayName} ${formatYen(referenceAnalysis.totalRevenue - analysis.totalRevenue)}。` : `Revenue trailed ${referenceAnalysis.displayName} by ${formatYen(referenceAnalysis.totalRevenue - analysis.totalRevenue)}.`);
    if (analysis.grossMargin < referenceAnalysis.grossMargin) failureReasons.push(isZh ? `毛利率较基准低 ${((referenceAnalysis.grossMargin - analysis.grossMargin) * 100).toFixed(1)} 点。` : `Margin lagged benchmark by ${((referenceAnalysis.grossMargin - analysis.grossMargin) * 100).toFixed(1)} points.`);
    if (analysis.errorRate > referenceAnalysis.errorRate) failureReasons.push(isZh ? `错误率比基准高 ${((analysis.errorRate - referenceAnalysis.errorRate) * 100).toFixed(1)} 点。` : `Error rate was ${((analysis.errorRate - referenceAnalysis.errorRate) * 100).toFixed(1)} points higher than benchmark.`);
    if (analysis.zeroRevenueDays > referenceAnalysis.zeroRevenueDays) failureReasons.push(isZh ? `零收入天数更多（${analysis.zeroRevenueDays} vs ${referenceAnalysis.zeroRevenueDays}），削弱了现金流复利。` : `More zero-revenue days (${analysis.zeroRevenueDays} vs ${referenceAnalysis.zeroRevenueDays}) reduced compounding cash flow.`);
    if (failureReasons.length === 0) failureReasons.push(isZh ? "相对参考模型未观察到明显结构性失败。" : "No major structural failure observed relative to the reference model.");

    const relationLabel = hasReferencePeer
      ? (idx === 0 ? (isZh ? "对比亚军" : "vs Runner-up") : (isZh ? "对比冠军" : "vs Top Model"))
      : (isZh ? "单模型运行" : "Single Model Run");
    const comparisonNarrative = hasReferencePeer
      ? (isZh
          ? `${analysis.displayName} 相比 ${referenceAnalysis.displayName} 的 30 天净现金差值为 ${formatYen(result.finalScore - referenceResult.finalScore)}。差距主要来自收入（${formatYen(analysis.totalRevenue - referenceAnalysis.totalRevenue)}）、毛利率（${((analysis.grossMargin - referenceAnalysis.grossMargin) * 100).toFixed(1)} 点）和执行可靠性（错误率差 ${((analysis.errorRate - referenceAnalysis.errorRate) * 100).toFixed(1)} 点）。`
          : `${analysis.displayName} is ${formatYen(result.finalScore - referenceResult.finalScore)} away from ${referenceAnalysis.displayName} in 30-Day Net Cash. The gap combines revenue (${formatYen(analysis.totalRevenue - referenceAnalysis.totalRevenue)}), margin (${((analysis.grossMargin - referenceAnalysis.grossMargin) * 100).toFixed(1)} pts), and tool reliability (${((analysis.errorRate - referenceAnalysis.errorRate) * 100).toFixed(1)} pts error-rate delta).`)
      : (isZh ? "当前仅有单模型数据，暂不支持对比基准分析。" : "Only one model is available in this run, so comparative benchmarking is not available yet.");

    const chapters = [
      {
        title: isZh ? "开局阶段" : "Opening Setup",
        dayRange: isZh ? "第 1-10 天" : "Day 1-10",
        thesis:
          phaseMetrics.early.profit >= 0
            ? (isZh
                ? `模型在前 10 天完成了较稳健开局，收入 ${formatYen(phaseMetrics.early.revenue)}，净利润 ${formatYen(phaseMetrics.early.profit)}。`
                : `The model established a viable opening with ${formatYen(phaseMetrics.early.revenue)} revenue and ${formatYen(phaseMetrics.early.profit)} net profit in the first 10 days.`)
            : (isZh
                ? `开局不稳定：尽管收入达到 ${formatYen(phaseMetrics.early.revenue)}，但第 1-10 天净利润为 ${formatYen(phaseMetrics.early.profit)}。`
                : `The opening was unstable: despite ${formatYen(phaseMetrics.early.revenue)} revenue, the model ended Day 1-10 at ${formatYen(phaseMetrics.early.profit)} net profit.`),
        bullets: [
          isZh
            ? `核心动作：采购 ${phaseActions.early.purchase} 次，调价 ${phaseActions.early.setPrice} 次，促销 ${phaseActions.early.promotion} 次。`
            : `Core actions: ${phaseActions.early.purchase} purchases, ${phaseActions.early.setPrice} pricing changes, ${phaseActions.early.promotion} promotions.`,
          isZh
            ? `执行负载：工具调用 ${phaseMetrics.early.toolCalls} 次，阶段错误率 ${(phaseMetrics.early.errors / Math.max(1, phaseMetrics.early.toolCalls) * 100).toFixed(1)}%。`
            : `Execution load: ${phaseMetrics.early.toolCalls} tool calls with ${(phaseMetrics.early.errors / Math.max(1, phaseMetrics.early.toolCalls) * 100).toFixed(1)}% phase error rate.`,
          isZh
            ? `需求连续性：零收入天数 ${phaseMetrics.early.zeroRevenueDays} 天。`
            : `Demand continuity: ${phaseMetrics.early.zeroRevenueDays} zero-revenue days.`,
        ],
        evidence:
          isZh
            ? `全周期最佳日为 D${best.day}（${formatYen(best.profit)}），最差日为 D${worst.day}（${formatYen(worst.profit)}）。`
            : `Best day in full run occurred on D${best.day} (${formatYen(best.profit)}), worst on D${worst.day} (${formatYen(worst.profit)}).`,
      },
      {
        title: isZh ? "中程优化" : "Mid-Run Optimization",
        dayRange: isZh ? "第 11-20 天" : "Day 11-20",
        thesis:
          phaseMetrics.mid.profit >= 0
            ? (isZh
                ? `中程决策形成正向累积，第 11-20 天利润为 ${formatYen(phaseMetrics.mid.profit)}。`
                : `Mid-run decisions compounded positively, producing ${formatYen(phaseMetrics.mid.profit)} profit in Days 11-20.`)
            : (isZh
                ? `中程未能稳定盈利，第 11-20 天利润为 ${formatYen(phaseMetrics.mid.profit)}。`
                : `Mid-run failed to stabilize profitability, with ${formatYen(phaseMetrics.mid.profit)} profit during Days 11-20.`),
        bullets: [
          isZh
            ? `本阶段调价节奏为 ${phaseActions.mid.setPrice} 次。`
            : `Pricing cadence shifted to ${phaseActions.mid.setPrice} updates in this phase.`,
          isZh
            ? `采购与促销平衡：采购 ${phaseActions.mid.purchase} 次，促销 ${phaseActions.mid.promotion} 次。`
            : `Procurement + promotion balance: ${phaseActions.mid.purchase} purchase calls and ${phaseActions.mid.promotion} promotions.`,
          isZh
            ? `工具吞吐：调用 ${phaseMetrics.mid.toolCalls} 次；零收入天数 ${phaseMetrics.mid.zeroRevenueDays} 天。`
            : `Tool throughput stayed at ${phaseMetrics.mid.toolCalls} calls; zero-revenue days: ${phaseMetrics.mid.zeroRevenueDays}.`,
        ],
        evidence: isZh
          ? `全程毛利率为 ${formatPct(analysis.grossMargin)}，整体工具调用错误率为 ${formatPct(analysis.errorRate)}。`
          : `Gross margin at run level is ${formatPct(analysis.grossMargin)}, with overall Tool Call Error Rate at ${formatPct(analysis.errorRate)}.`,
      },
      {
        title: isZh ? "收官执行" : "Endgame Execution",
        dayRange: isZh ? "第 21-30 天" : "Day 21-30",
        thesis:
          phaseMetrics.late.profit >= 0
            ? (isZh
                ? `模型在收官阶段保持韧性执行，后 10 天利润为 ${formatYen(phaseMetrics.late.profit)}。`
                : `The model closed with resilient endgame execution and ${formatYen(phaseMetrics.late.profit)} late-phase profit.`)
            : (isZh
                ? `收官阶段拖累整体结果：第 21-30 天净利润为 ${formatYen(phaseMetrics.late.profit)}。`
                : `Late phase dragged results down: Days 21-30 produced ${formatYen(phaseMetrics.late.profit)} net profit.`),
        bullets: [
          isZh
            ? `后段动作：采购 ${phaseActions.late.purchase} 次，调价 ${phaseActions.late.setPrice} 次，促销 ${phaseActions.late.promotion} 次。`
            : `Late actions: ${phaseActions.late.purchase} purchases, ${phaseActions.late.setPrice} pricing changes, ${phaseActions.late.promotion} promotions.`,
          isZh
            ? `现金转化压力：最后 10 天中有 ${phaseMetrics.late.zeroRevenueDays} 天零收入。`
            : `Cash conversion pressure: ${phaseMetrics.late.zeroRevenueDays} zero-revenue days in the final 10-day window.`,
          isZh
            ? `收官阶段执行质量：错误率 ${(phaseMetrics.late.errors / Math.max(1, phaseMetrics.late.toolCalls) * 100).toFixed(1)}%（${phaseMetrics.late.errors}/${phaseMetrics.late.toolCalls}）。`
            : `Final phase execution quality: ${(phaseMetrics.late.errors / Math.max(1, phaseMetrics.late.toolCalls) * 100).toFixed(1)}% error rate (${phaseMetrics.late.errors}/${phaseMetrics.late.toolCalls}).`,
        ],
        evidence: isZh
          ? `30 天结束后净现金为 ${formatYen(result.finalScore)}，对比 ${referenceAnalysis.displayName} 的 ${formatYen(referenceResult.finalScore)}。`
          : `Run finished at ${formatYen(result.finalScore)} net cash after 30 days, versus ${formatYen(referenceResult.finalScore)} for ${referenceAnalysis.displayName}.`,
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
        metric: isZh ? "净现金" : "Net Cash",
        [modelKey]: normalizeTo100(result.finalScore, scoreMin, scoreMax),
        [referenceKey]: normalizeTo100(referenceResult.finalScore, scoreMin, scoreMax),
      },
      {
        metric: isZh ? "收入" : "Revenue",
        [modelKey]: normalizeTo100(analysis.totalRevenue, revenueMin, revenueMax),
        [referenceKey]: normalizeTo100(referenceAnalysis.totalRevenue, revenueMin, revenueMax),
      },
      {
        metric: isZh ? "毛利率" : "Gross Margin",
        [modelKey]: normalizeTo100(analysis.grossMargin, marginMin, marginMax),
        [referenceKey]: normalizeTo100(referenceAnalysis.grossMargin, marginMin, marginMax),
      },
      {
        metric: isZh ? "工具可靠性" : "Tool Reliability",
        [modelKey]: normalizeTo100(1 - analysis.errorRate, reliabilityMin, reliabilityMax),
        [referenceKey]: normalizeTo100(1 - referenceAnalysis.errorRate, reliabilityMin, reliabilityMax),
      },
      {
        metric: isZh ? "定价活跃度" : "Pricing Activity",
        [modelKey]: normalizeTo100(analysis.setPriceCalls, pricingMin, pricingMax),
        [referenceKey]: normalizeTo100(referenceAnalysis.setPriceCalls, pricingMin, pricingMax),
      },
      {
        metric: isZh ? "盈利天数" : "Profitable Days",
        [modelKey]: normalizeTo100(analysis.profitableDays, profitableMin, profitableMax),
        [referenceKey]: normalizeTo100(referenceAnalysis.profitableDays, profitableMin, profitableMax),
      },
    ];

    const toolMixData: Record<string, string | number>[] = (Object.keys(categoryLabels) as CategoryKey[]).map(cat => ({
      category: categoryLabels[cat],
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
