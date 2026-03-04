import { notFound } from "next/navigation";
import Image from "next/image";
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
          "ShopBench 是一个让模型模拟经营30天的Benchmark，以反映模型在长时运行的商业环境中的表现。",
        tldr: "一句话结论",
        t1: "每个模型都在同一环境下经营便利店 30 天。",
        t2: "排行榜主指标是 30 天净现金，不是毛利率。",
        t3: "目标是评估长期执行能力，而不是单轮问答能力。",
        how: "一次运行如何进行",
        flow: "晨报输入 → 工具决策 → 当日结算 → 连续 30 天 → 最终得分",
        h1: "读取每日上下文：天气、事件、库存、现金、员工、在途订单。",
        h2: "调用工具做经营决策：补货、定价、促销、营业时段、排班等。",
        h3: "当模型不再调用工具，当天自动结算。",
        h4: "重复 30 天形成完整结果。",
        tools: "可用工具（按类别）",
        info: "信息类：库存、财务、销量、供应商、天气、竞品、员工状态。",
        ops: "运营类：采购、定价、促销、调整营业时间、库存处置。",
        people: "人力类：招聘、解雇、排班。",
        finance: "财务类：贷款、还款。",
        strategy: "策略类：供应商谈判、门店升级、营销活动。",
        metrics: "排名指标与口径",
        formula: "Score = final cash - starting cash - outstanding loans",
        m1: "30 天净现金：排行榜主指标。",
        m2: "每日净利润：收入 - 销售成本 - 人工 - 房租 - 利息 - 营销 - 其他成本。",
        m3: "每日毛利润：收入 - 销售成本（不含人工/房租/营销）。",
        m4: "毛利率：用于诊断的比例指标，不用于最终排名。",
        scope: "限制与不足",
        s1: "当前评测窗口固定为 30 天。",
        s2: "当前设定下，期末库存不计入最终得分。",
        s3: "单次 run 有参考价值，但建议多次重复验证稳定性。",
      }
    : {
        title: "About ShopBench",
        subtitle:
          "ShopBench is a benchmark where models simulate operating for 30 days, reflecting how they perform in long-running business environments.",
        tldr: "TL;DR",
        t1: "Each model runs one 30-day convenience-store simulation in the same environment.",
        t2: "Primary ranking metric is 30-Day Net Cash, not gross margin.",
        t3: "Focus is long-horizon execution quality, not one-turn QA quality.",
        how: "How one run works",
        flow: "Morning brief → tool decisions → day settlement → repeat for 30 days → final score",
        h1: "Read daily context: weather, events, inventory, cash, staff, and pending orders.",
        h2: "Use tools to decide purchases, pricing, promotions, hours, staffing, and strategy actions.",
        h3: "When model stops tool calls, that day is settled automatically.",
        h4: "Repeat for 30 simulated days.",
        tools: "Available tools (by category)",
        info: "Information: inventory, financials, sales history, suppliers, weather, competitors, employee status.",
        ops: "Operations: purchase goods, set price, run promotion, adjust hours, dispose goods.",
        people: "Personnel: hire, fire, assign shift.",
        finance: "Finance: take loan, repay loan.",
        strategy: "Strategy: negotiate supplier, upgrade store, launch marketing.",
        metrics: "Ranking metric and definitions",
        formula: "Score = final cash - starting cash - outstanding loans",
        m1: "30-Day Net Cash: primary leaderboard metric.",
        m2: "Daily Net Profit: revenue - COGS - wages - rent - interest - marketing - other costs.",
        m3: "Daily Gross Profit: revenue - COGS (excluding wages/rent/marketing).",
        m4: "Gross Margin: diagnostic ratio, not the final ranking metric.",
        scope: "Limitations and Gaps",
        s1: "Current benchmark window is fixed at 30 days.",
        s2: "End-of-run inventory is excluded from final score in this setup.",
        s3: "Single runs are informative; repeated runs are recommended for robustness.",
      };

  const toolSections = isZh
    ? [
        {
          title: "信息类",
          items: [
            { name: "check_inventory", desc: "查看库存数量、售价、成本和临期压力。" },
            { name: "view_financials", desc: "查看现金、损益、贷款和库存价值快照。" },
            { name: "check_market_trends", desc: "查看商品需求与市场趋势信号。" },
            { name: "view_customer_feedback", desc: "查看满意度、口碑和近期反馈。" },
            { name: "view_competitors", desc: "查看竞品定价与促销动作。" },
            { name: "check_weather_forecast", desc: "查看未来天气，用于判断客流与需求变化。" },
            { name: "view_employee_status", desc: "查看员工士气、技能、排班和工资。" },
            { name: "view_suppliers", desc: "查看供应商成本、时效、可靠性和起订门槛。" },
            { name: "view_pending_orders", desc: "查看在途订单和预计到货时间。" },
            { name: "estimate_order", desc: "下单前试算成本并校验是否达到起订金额。" },
            { name: "view_sales_history", desc: "查看近期销量、收入和缺货情况。" },
          ],
        },
        {
          title: "运营类",
          items: [
            { name: "purchase_goods", desc: "执行采购，下单后现金立即扣除。" },
            { name: "set_price", desc: "调整商品售价。" },
            { name: "run_promotion", desc: "发起限时折扣促销。" },
            { name: "adjust_store_hours", desc: "调整营业时段，在客流和成本之间权衡。" },
            { name: "dispose_goods", desc: "处置库存，降低临期与质量风险。" },
          ],
        },
        {
          title: "人力类",
          items: [
            { name: "hire_employee", desc: "招聘员工，提升服务能力但增加工资成本。" },
            { name: "fire_employee", desc: "解雇员工，缩减人力成本。" },
            { name: "assign_shift", desc: "安排员工班次，保障日常运营。" },
          ],
        },
        {
          title: "财务类",
          items: [
            { name: "take_loan", desc: "贷款补充现金，但会产生利息成本。" },
            { name: "repay_loan", desc: "偿还贷款，降低后续利息负担。" },
          ],
        },
        {
          title: "策略类",
          items: [
            { name: "negotiate_supplier", desc: "与供应商谈判争取更低采购成本。" },
            { name: "upgrade_store", desc: "进行门店升级，换取长期经营收益。" },
            { name: "launch_marketing", desc: "投放营销活动，提升客流和口碑。" },
          ],
        },
      ]
    : [
        {
          title: "Information",
          items: [
            { name: "check_inventory", desc: "View stock, prices, cost basis, and expiry pressure." },
            { name: "view_financials", desc: "Check cash, P&L, loans, and inventory value snapshot." },
            { name: "check_market_trends", desc: "Inspect product demand and market direction signals." },
            { name: "view_customer_feedback", desc: "Read satisfaction, reputation, and recent customer comments." },
            { name: "view_competitors", desc: "See competitor pricing and promotion posture." },
            { name: "check_weather_forecast", desc: "Get upcoming weather that affects foot traffic and demand." },
            { name: "view_employee_status", desc: "Check staff morale, skill, shifts, and wage details." },
            { name: "view_suppliers", desc: "Review supplier costs, lead time, reliability, and minimum order." },
            { name: "view_pending_orders", desc: "Track in-transit purchase orders and ETA." },
            { name: "estimate_order", desc: "Dry-run order cost and minimum check before placing it." },
            { name: "view_sales_history", desc: "Review recent sell-through, revenue, and stockout patterns." },
          ],
        },
        {
          title: "Operations",
          items: [
            { name: "purchase_goods", desc: "Place purchase orders; cash is deducted immediately." },
            { name: "set_price", desc: "Change selling price for a product." },
            { name: "run_promotion", desc: "Apply temporary discount campaigns." },
            { name: "adjust_store_hours", desc: "Change opening hours to trade traffic for operating cost." },
            { name: "dispose_goods", desc: "Discard inventory to manage expiry and quality risk." },
          ],
        },
        {
          title: "Personnel",
          items: [
            { name: "hire_employee", desc: "Add staff capacity at additional wage cost." },
            { name: "fire_employee", desc: "Remove an employee from the roster." },
            { name: "assign_shift", desc: "Set staff shift schedule for daily operations." },
          ],
        },
        {
          title: "Finance",
          items: [
            { name: "take_loan", desc: "Borrow cash with daily interest." },
            { name: "repay_loan", desc: "Repay outstanding debt to reduce interest burden." },
          ],
        },
        {
          title: "Strategy",
          items: [
            { name: "negotiate_supplier", desc: "Negotiate supplier terms for better unit costs." },
            { name: "upgrade_store", desc: "Buy permanent store upgrades with one-time investment." },
            { name: "launch_marketing", desc: "Run marketing campaigns to boost traffic and reputation." },
          ],
        },
      ];

  return (
    <div className="container">
      <div className="page-header">
        <h1>{text.title}</h1>
        <p>{text.subtitle}</p>
      </div>

      <article className="card about-doc">
        <section className="about-doc-section">
          <figure className="about-snapshot">
            <Image
              src="/about-overview.jpg"
              alt=""
              width={1600}
              height={900}
              className="about-snapshot-image"
              sizes="(max-width: 900px) 100vw, 860px"
              style={{ width: "100%", height: "auto" }}
            />
          </figure>
        </section>

        <section className="about-doc-section">
          <h2>{text.tldr}</h2>
          <ul className="about-step-list">
            <li>{text.t1}</li>
            <li>{text.t2}</li>
            <li>{text.t3}</li>
          </ul>
        </section>

        <section className="about-doc-section">
          <h2>{text.how}</h2>
          <div className="about-flow-figure">{text.flow}</div>
          <ol className="about-step-list">
            <li>{text.h1}</li>
            <li>{text.h2}</li>
            <li>{text.h3}</li>
            <li>{text.h4}</li>
          </ol>
        </section>

        <section className="about-doc-section">
          <h2>{text.tools}</h2>
          {toolSections.map(section => (
            <div key={section.title} style={{ marginBottom: "0.75rem" }}>
              <p style={{ marginBottom: "0.35rem" }}><strong>{section.title}</strong></p>
              <ul className="about-step-list">
                {section.items.map(item => (
                  <li key={item.name}>
                    <code>{item.name}</code>{isZh ? "：" : ":"} {item.desc}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="about-doc-section">
          <h2>{text.metrics}</h2>
          <div className="about-formula">{text.formula}</div>
          <ul className="about-step-list">
            <li>{text.m1}</li>
            <li>{text.m2}</li>
            <li>{text.m3}</li>
            <li>{text.m4}</li>
          </ul>
        </section>

        <section className="about-doc-section">
          <h2>{text.scope}</h2>
          <ul className="about-step-list">
            <li>{text.s1}</li>
            <li>{text.s2}</li>
            <li>{text.s3}</li>
          </ul>
        </section>

      </article>
    </div>
  );
}
