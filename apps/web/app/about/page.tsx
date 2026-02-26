import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About ShopBench — AI Business Simulation Benchmark",
  description: "Learn how ShopBench evaluates AI models through a 30-day convenience store simulation",
};

export default function AboutPage() {
  return (
    <div className="container">
      <div className="page-header">
        <h1>About ShopBench</h1>
        <p>
          ShopBench is an agent benchmark for business decision-making. Models manage a convenience store for 30 simulated days,
          and are compared under the same environment, tools, and scoring rules.
        </p>
      </div>

      <div className="about-grid">
        <section className="card">
          <h3>What is ShopBench</h3>
          <p>
            This is not a one-shot QA test. It is a continuous operating environment where inventory, cash, customer flow,
            weather, staff status, and events keep changing day by day.
          </p>
          <p style={{ marginBottom: 0 }}>
            It is designed to measure whether an agent can run a business over time, not just answer a single prompt well.
          </p>
        </section>

        <section className="card">
          <h3>Model Task (What happens each day)</h3>
          <ol className="about-step-list">
            <li>Read the morning brief: weather, events, inventory, cash, staff, and in-transit orders.</li>
            <li>Use tools to make decisions: inspect data, restock, set prices, run promotions, assign shifts, launch marketing, etc.</li>
            <li>End the turn: when the model responds without tool calls, the day is settled automatically.</li>
            <li>Repeat for 30 days: this forms one complete benchmark run.</li>
          </ol>
        </section>

        <section className="card">
          <h3>Available Decision Actions</h3>
          <ul className="about-step-list">
            <li><strong>Information:</strong> inventory, financials, sales history, suppliers, weather, competitors, employee status.</li>
            <li><strong>Operations:</strong> purchase goods, set price, run promotion, adjust hours, dispose inventory.</li>
            <li><strong>Personnel:</strong> hire, fire, assign shift.</li>
            <li><strong>Finance:</strong> take loan, repay loan.</li>
            <li><strong>Strategy:</strong> negotiate supplier, upgrade store, launch marketing.</li>
          </ul>
        </section>

        <section className="card">
          <h3>How Scoring Works (Core)</h3>
          <div className="about-formula">
            Score = final cash - starting cash - outstanding loans
          </div>
          <p>
            In the current setup, end-of-run inventory is not counted toward the final score. The benchmark therefore rewards
            real cash conversion within the fixed 30-day window.
          </p>
          <div className="about-note">
            <strong>Three terms to distinguish:</strong>
            <ul className="about-step-list" style={{ marginTop: "0.5rem" }}>
              <li><strong>Revenue scaling ability:</strong> how much sales volume the model can generate.</li>
              <li><strong>Accounting gross profit:</strong> revenue minus COGS of sold items.</li>
              <li><strong>Cash conversion ability:</strong> whether spending is converted back into cash in time.</li>
            </ul>
          </div>
        </section>

        <section className="card">
          <h3>What Capabilities It Evaluates</h3>
          <ul className="about-step-list">
            <li><strong>Execution reliability:</strong> valid and consistent tool use with low error rate.</li>
            <li><strong>Inventory and cash control:</strong> avoid overstocking and cash lock-up.</li>
            <li><strong>Profit quality:</strong> improve net outcomes, not just top-line revenue.</li>
            <li><strong>Stability over time:</strong> maintain robust decisions across many sequential days.</li>
          </ul>
        </section>

        <section className="card">
          <h3>How to Reproduce Quickly</h3>
          <p>1) Run one benchmark simulation:</p>
          <pre className="about-code">{`pnpm run:bench -- --model openai/gpt-5.3-codex --api-key <YOUR_KEY>`}</pre>
          <p>2) Start the web dashboard:</p>
          <pre className="about-code">{`pnpm --filter @shopbench/web dev`}</pre>
          <p style={{ marginBottom: 0 }}>
            Then open the site to view Leaderboard, Compare, Report, and Replay pages.
          </p>
        </section>
      </div>
    </div>
  );
}
