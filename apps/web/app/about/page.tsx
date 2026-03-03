import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About ShopBench — AI Business Simulation Benchmark",
  description: "Learn how ShopBench evaluates AI models through a 30-day convenience store simulation",
};

export default function AboutPage() {
  const toolSections = [
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
  ] as const;

  return (
    <div className="container">
      <div className="page-header">
        <h1>About ShopBench</h1>
        <p>
          ShopBench is a benchmark where models simulate operating for 30 days, reflecting how they perform in long-running
          business environments.
        </p>
      </div>

      <article className="card about-doc">
        <section className="about-doc-section">
          <h2>TL;DR</h2>
          <ul className="about-step-list">
            <li>Each model runs one 30-day convenience-store simulation with the same environment and tools.</li>
            <li>Primary ranking metric is 30-Day Net Cash, not gross margin.</li>
            <li>Goal is to evaluate long-horizon agent execution, not single-turn answer quality.</li>
          </ul>
        </section>

        <section className="about-doc-section">
          <h2>How one run works</h2>
          <div className="about-flow-figure">
            Morning brief → tool decisions → day settlement → repeat for 30 days → final score
          </div>
          <ol className="about-step-list">
            <li>Read daily context: weather, events, inventory, cash, staff, and pending orders.</li>
            <li>Use tools to decide purchases, pricing, promotions, hours, staffing, and strategy actions.</li>
            <li>When model stops tool calls, the environment settles that day automatically.</li>
            <li>Repeat for 30 simulated days.</li>
          </ol>
        </section>

        <section className="about-doc-section">
          <h2>Available tools (by category)</h2>
          {toolSections.map(section => (
            <div key={section.title} style={{ marginBottom: "0.75rem" }}>
              <p style={{ marginBottom: "0.35rem" }}><strong>{section.title}</strong></p>
              <ul className="about-step-list">
                {section.items.map(item => (
                  <li key={item.name}>
                    <code>{item.name}</code>: {item.desc}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="about-doc-section">
          <h2>Ranking metric and metric definitions</h2>
          <div className="about-formula">Score = final cash - starting cash - outstanding loans</div>
          <ul className="about-step-list">
            <li><strong>30-Day Net Cash:</strong> ranking metric used on the leaderboard.</li>
            <li><strong>Daily Net Profit:</strong> revenue - COGS - wages - rent - interest - marketing - other costs.</li>
            <li><strong>Daily Gross Profit:</strong> revenue - COGS (does not include wages/rent/marketing).</li>
            <li><strong>Gross Margin:</strong> ratio indicator, useful for diagnostics but not final ranking.</li>
          </ul>
        </section>

        <section className="about-doc-section">
          <h2>Limitations and Gaps</h2>
          <ul className="about-step-list">
            <li>Current benchmark window is fixed at 30 days.</li>
            <li>End-of-run inventory is not included in final score in this setup.</li>
            <li>Single-run results are informative but should be validated with repeated runs.</li>
          </ul>
        </section>

      </article>
    </div>
  );
}
