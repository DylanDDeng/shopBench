interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
}

interface Props {
  toolCalls: ToolCall[];
  settlement: {
    revenue: number;
    expenses: number;
    netProfit: number;
    customerCount: number;
    summary: string;
  };
  morningBrief: string;
}

export function Timeline({ toolCalls, settlement, morningBrief }: Props) {
  return (
    <div>
      <div className="timeline-item event">
        <strong>Morning Brief</strong>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.8rem", color: "#aaa", margin: "0.5rem 0 0" }}>
          {morningBrief}
        </pre>
      </div>

      {toolCalls.map((tc, i) => (
        <div key={i} className="timeline-item tool">
          <strong>{tc.name}</strong>
          <span style={{ color: "#888", marginLeft: "0.5rem", fontSize: "0.8rem" }}>
            {JSON.stringify(tc.arguments)}
          </span>
          <div style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "0.25rem" }}>
            {typeof tc.result === "object" && tc.result !== null && "error" in (tc.result as Record<string, unknown>)
              ? <span style={{ color: "#ef4444" }}>Error: {String((tc.result as Record<string, unknown>).error)}</span>
              : <span style={{ color: "#10b981" }}>OK</span>
            }
          </div>
        </div>
      ))}

      <div className="timeline-item settlement">
        <strong>Day Settlement</strong>
        <div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
          <span>Customers: {settlement.customerCount}</span>
          {" | "}
          <span>Revenue: ¥{settlement.revenue.toFixed(2)}</span>
          {" | "}
          <span className={settlement.netProfit >= 0 ? "profit-positive" : "profit-negative"}>
            Net: ¥{settlement.netProfit.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
