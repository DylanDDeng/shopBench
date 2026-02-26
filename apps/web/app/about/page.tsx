import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About ShopBench — AI Business Simulation Benchmark",
  description: "了解 ShopBench 如何通过便利店经营仿真评估 AI 模型的决策与执行能力",
};

export default function AboutPage() {
  return (
    <div className="container">
      <div className="page-header">
        <h1>About ShopBench</h1>
        <p>
          ShopBench 是一个面向大模型的经营决策 Benchmark：让模型在 30 天便利店仿真中做经营决策，
          用统一规则比较它们的真实经营能力。
        </p>
      </div>

      <div className="about-grid">
        <section className="card">
          <h3>什么是 ShopBench</h3>
          <p>
            它不是单轮问答测试，而是一个连续经营环境。模型需要在库存、现金、客流、天气、员工状态和市场事件不断变化的条件下，
            持续做出可执行的业务决策。
          </p>
          <p style={{ marginBottom: 0 }}>
            更适合评估「能不能长期把业务跑好」，而不仅是「单次回答是否聪明」。
          </p>
        </section>

        <section className="card">
          <h3>模型任务（每天要做什么）</h3>
          <ol className="about-step-list">
            <li>读取晨报：天气、事件、库存、现金、员工和在途订单状态。</li>
            <li>调用工具决策：查数、进货、调价、促销、排班、营销等。</li>
            <li>结束当日：模型输出文本结束回合，系统自动日结。</li>
            <li>进入下一天：重复 30 天，直到产生最终结果。</li>
          </ol>
        </section>

        <section className="card">
          <h3>可用决策动作</h3>
          <ul className="about-step-list">
            <li><strong>信息查询：</strong>库存、财务、销售历史、供应商、天气、竞争对手、员工状态。</li>
            <li><strong>运营动作：</strong>采购补货、设置价格、运行促销、调整营业时间、处理库存。</li>
            <li><strong>人员管理：</strong>招聘、解雇、排班。</li>
            <li><strong>财务动作：</strong>借款、还款。</li>
            <li><strong>策略动作：</strong>供应商谈判、门店升级、营销投放。</li>
          </ul>
        </section>

        <section className="card">
          <h3>如何评分（核心）</h3>
          <div className="about-formula">
            Score = final cash - starting cash - outstanding loans
          </div>
          <p>
            在当前场景下，期末库存不计入分数（按 0 折现）。因此，分数本质上看的是最终现金回笼能力。
          </p>
          <div className="about-note">
            <strong>三个概念要区分：</strong>
            <ul className="about-step-list" style={{ marginTop: "0.5rem" }}>
              <li><strong>营收冲量能力：</strong>卖了多少钱（流水高不等于赚钱）。</li>
              <li><strong>会计口径毛利润：</strong>营收 - 已售商品成本（不等于最终可用现金）。</li>
              <li><strong>现金回笼能力：</strong>花出去的钱能否在周期内真实回到现金余额。</li>
            </ul>
          </div>
        </section>

        <section className="card">
          <h3>评估的能力维度</h3>
          <ul className="about-step-list">
            <li><strong>执行正确率：</strong>工具调用是否有效、是否频繁报错。</li>
            <li><strong>库存与现金管理：</strong>是否避免盲目囤货和现金占压。</li>
            <li><strong>利润质量：</strong>是否通过结构化策略提高净收益，而不是只冲营收。</li>
            <li><strong>稳定性：</strong>是否能在连续多天变化环境下持续做出一致决策。</li>
          </ul>
        </section>

        <section className="card">
          <h3>如何快速复现</h3>
          <p>1) 运行一个模型进行 benchmark：</p>
          <pre className="about-code">{`pnpm run:bench -- --model openai/gpt-5.3-codex --api-key <YOUR_KEY>`}</pre>
          <p>2) 启动 Web 看板：</p>
          <pre className="about-code">{`pnpm --filter @shopbench/web dev`}</pre>
          <p style={{ marginBottom: 0 }}>
            然后打开站点查看 Leaderboard、Compare、Report 和 Replay 页面。
          </p>
        </section>
      </div>
    </div>
  );
}
