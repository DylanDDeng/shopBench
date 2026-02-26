/* ─── Chart Theme Configuration ─── */

export const CHART_THEME = {
  grid: { stroke: "#2a2a2a", strokeDasharray: "3 3" },
  axis: { stroke: "#666", fontSize: 12 },
  tooltip: {
    contentStyle: {
      background: "#1a1a1a",
      border: "1px solid #333",
      borderRadius: "8px",
      fontSize: "13px",
      color: "#ededed",
    },
    cursor: { stroke: "#444" },
  },
  animation: { duration: 800, easing: "ease-out" as const },
  referenceLine: { stroke: "#444", strokeDasharray: "4 4" },
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
