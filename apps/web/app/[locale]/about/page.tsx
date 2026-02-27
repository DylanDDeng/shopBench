import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export default async function LocalizedAboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const isZh = locale === "zh";
  const text = isZh
    ? {
        title: "关于 ShopBench",
        subtitle:
          "ShopBench 是一个用于商业决策能力评估的 Agent 基准测试。模型在同一环境中经营便利店 30 天，并按统一规则评分。",
        what: "什么是 ShopBench",
        whatP1:
          "这不是一次性问答测试，而是持续变化的经营环境。库存、现金流、客流、天气、员工状态和事件会每天变化。",
        whatP2:
          "它衡量的是模型能否在时间维度上持续经营业务，而不是只回答好一次提示词。",
        task: "模型每天要做什么",
        task1: "读取晨报：天气、事件、库存、现金、员工和在途订单。",
        task2: "调用工具进行决策：查数据、补货、定价、促销、排班、营销等。",
        task3: "结束回合：当模型不再调用工具时，当天自动结算。",
        task4: "连续 30 天：构成一次完整 benchmark。",
        actions: "可用决策动作",
        info: "信息类：库存、财务、销量、供应商、天气、竞品、员工状态。",
        ops: "运营类：采购、定价、促销、调整营业时间、库存处置。",
        people: "人力类：招聘、解雇、排班。",
        finance: "财务类：贷款、还款。",
        strategy: "策略类：供应商谈判、门店升级、营销活动。",
        scoring: "评分机制（核心）",
        formula: "Score = final cash - starting cash - outstanding loans",
        scoringP:
          "当前设定下，期末库存价值不计入最终得分，因此该基准强调固定 30 天窗口内的现金回收能力。",
        terms: "需要区分的三个概念：",
        term1: "收入扩张能力：模型能拉起多少销售规模。",
        term2: "会计毛利润：已售商品收入减去销售成本。",
        term3: "现金转化能力：投入能否及时回到现金。",
        capabilities: "评估能力维度",
        c1: "执行可靠性：工具调用有效且错误率低。",
        c2: "库存与现金控制：避免压货和现金占用。",
        c3: "利润质量：提升净收益，而不仅是冲收入。",
        c4: "长期稳定性：多日连续决策仍保持鲁棒。",
        reproduce: "快速复现",
        step1: "1) 运行一次 benchmark：",
        step2: "2) 启动 Web 看板：",
        end: "然后打开站点查看排行榜、对比、报告和回放页面。",
      }
    : {
        title: "About ShopBench",
        subtitle:
          "ShopBench is an agent benchmark for business decision-making. Models manage a convenience store for 30 simulated days, and are compared under the same environment, tools, and scoring rules.",
        what: "What is ShopBench",
        whatP1:
          "This is not a one-shot QA test. It is a continuous operating environment where inventory, cash, customer flow, weather, staff status, and events keep changing day by day.",
        whatP2:
          "It is designed to measure whether an agent can run a business over time, not just answer a single prompt well.",
        task: "Model Task (What happens each day)",
        task1: "Read the morning brief: weather, events, inventory, cash, staff, and in-transit orders.",
        task2: "Use tools to make decisions: inspect data, restock, set prices, run promotions, assign shifts, launch marketing, etc.",
        task3: "End the turn: when the model responds without tool calls, the day is settled automatically.",
        task4: "Repeat for 30 days: this forms one complete benchmark run.",
        actions: "Available Decision Actions",
        info: "Information: inventory, financials, sales history, suppliers, weather, competitors, employee status.",
        ops: "Operations: purchase goods, set price, run promotion, adjust hours, dispose inventory.",
        people: "Personnel: hire, fire, assign shift.",
        finance: "Finance: take loan, repay loan.",
        strategy: "Strategy: negotiate supplier, upgrade store, launch marketing.",
        scoring: "How Scoring Works (Core)",
        formula: "Score = final cash - starting cash - outstanding loans",
        scoringP:
          "In the current setup, end-of-run inventory is not counted toward the final score. The benchmark therefore rewards real cash conversion within the fixed 30-day window.",
        terms: "Three terms to distinguish:",
        term1: "Revenue scaling ability: how much sales volume the model can generate.",
        term2: "Accounting gross profit: revenue minus COGS of sold items.",
        term3: "Cash conversion ability: whether spending is converted back into cash in time.",
        capabilities: "What Capabilities It Evaluates",
        c1: "Execution reliability: valid and consistent tool use with low error rate.",
        c2: "Inventory and cash control: avoid overstocking and cash lock-up.",
        c3: "Profit quality: improve net outcomes, not just top-line revenue.",
        c4: "Stability over time: maintain robust decisions across many sequential days.",
        reproduce: "How to Reproduce Quickly",
        step1: "1) Run one benchmark simulation:",
        step2: "2) Start the web dashboard:",
        end: "Then open the site to view Leaderboard, Compare, Report, and Replay pages.",
      };

  return (
    <div className="container">
      <div className="page-header">
        <h1>{text.title}</h1>
        <p>{text.subtitle}</p>
      </div>

      <div className="about-grid">
        <section className="card">
          <h3>{text.what}</h3>
          <p>{text.whatP1}</p>
          <p style={{ marginBottom: 0 }}>{text.whatP2}</p>
        </section>

        <section className="card">
          <h3>{text.task}</h3>
          <ol className="about-step-list">
            <li>{text.task1}</li>
            <li>{text.task2}</li>
            <li>{text.task3}</li>
            <li>{text.task4}</li>
          </ol>
        </section>

        <section className="card">
          <h3>{text.actions}</h3>
          <ul className="about-step-list">
            <li>{text.info}</li>
            <li>{text.ops}</li>
            <li>{text.people}</li>
            <li>{text.finance}</li>
            <li>{text.strategy}</li>
          </ul>
        </section>

        <section className="card">
          <h3>{text.scoring}</h3>
          <div className="about-formula">{text.formula}</div>
          <p>{text.scoringP}</p>
          <div className="about-note">
            <strong>{text.terms}</strong>
            <ul className="about-step-list" style={{ marginTop: "0.5rem" }}>
              <li>{text.term1}</li>
              <li>{text.term2}</li>
              <li>{text.term3}</li>
            </ul>
          </div>
        </section>

        <section className="card">
          <h3>{text.capabilities}</h3>
          <ul className="about-step-list">
            <li>{text.c1}</li>
            <li>{text.c2}</li>
            <li>{text.c3}</li>
            <li>{text.c4}</li>
          </ul>
        </section>

        <section className="card">
          <h3>{text.reproduce}</h3>
          <p>{text.step1}</p>
          <pre className="about-code">{`pnpm run:bench -- --model openai/gpt-5.3-codex --api-key <YOUR_KEY>`}</pre>
          <p>{text.step2}</p>
          <pre className="about-code">{`pnpm --filter @shopbench/web dev`}</pre>
          <p style={{ marginBottom: 0 }}>{text.end}</p>
        </section>
      </div>
    </div>
  );
}
