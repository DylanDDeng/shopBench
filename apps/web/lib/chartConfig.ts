/* ─── Chart Theme Configuration ─── */

export const CHART_THEME = {
  grid: { stroke: "#dbe5f1", strokeDasharray: "4 4" },
  axis: {
    stroke: "#94a3b8",
    tick: { fill: "#475569", fontSize: 12 },
    fontSize: 12,
  },
  tooltip: {
    contentStyle: {
      background: "rgba(15, 23, 42, 0.96)",
      border: "1px solid #334155",
      borderRadius: "10px",
      fontSize: "12px",
      color: "#e2e8f0",
      boxShadow: "0 10px 30px rgba(2, 6, 23, 0.4)",
      padding: "0.45rem 0.6rem",
    },
    labelStyle: {
      color: "#bfdbfe",
      fontWeight: 600,
      marginBottom: "0.2rem",
    },
    itemStyle: {
      color: "#e2e8f0",
    },
    cursor: { stroke: "#94a3b8", strokeDasharray: "3 3", strokeWidth: 1 },
  },
  animation: { duration: 650, easing: "ease-out" as const },
  referenceLine: { stroke: "#64748b", strokeDasharray: "4 4", opacity: 0.9 },
};

/* ─── Model Colors ─── */

export const MODEL_COLORS = [
  "#60a5fa", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#a78bfa", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

/* ─── Tool Category Colors ─── */

export const TOOL_CATEGORY_COLORS: Record<string, string> = {
  info: "#60a5fa",       // blue
  operation: "#10b981",  // green
  personnel: "#f59e0b",  // amber
  finance: "#a78bfa",    // violet
  strategy: "#06b6d4",   // cyan
};

/* ─── Metric Colors ─── */

export const METRIC_COLORS = {
  profit: "#10b981",
  loss: "#ef4444",
  revenue: "#60a5fa",
  cash: "#f59e0b",
  inventory: "#a78bfa",
  customers: "#ec4899",
  satisfaction: "#06b6d4",
  tools: "#84cc16",
};

/* ─── Chart Dimension Presets ─── */

export const CHART_HEIGHT = {
  sm: 200,
  md: 300,
  lg: 400,
};
