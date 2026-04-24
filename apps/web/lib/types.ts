/* ─── Raw Data Types (match JSON schema) ─── */

export interface InventoryItem {
  productId: string;
  quantity: number;
  costPerUnit: number;
  price: number;
  expiryDay: number;
  batchId: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  dailyWage: number;
  morale: number;
  skill: number;
  shift: string;
  daysEmployed: number;
}

export interface FinancialRecord {
  day: number;
  revenue: number;
  costOfGoods: number;
  wages: number;
  rent: number;
  loanInterest: number;
  marketingSpend: number;
  otherExpenses: number;
  netProfit: number;
  cashBalance: number;
}

export interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  startDay: number;
  dueDay: number;
  remainingBalance: number;
}

export interface Promotion {
  productId: string;
  discountPct: number;
  startDay: number;
  endDay: number;
}

export interface PendingOrder {
  id: string;
  supplierId: string;
  items: { productId: string; quantity: number; unitCost: number }[];
  totalCost: number;
  orderDay: number;
  expectedArrivalDay: number;
  arrived: boolean;
}

export interface StateSnapshot {
  day: number;
  weather: string;
  isWeekend: boolean;
  holiday: string | null;
  cash: number;
  inventory: InventoryItem[];
  employees: Employee[];
  reputation: number;
  customerSatisfaction: number;
  pendingOrders: PendingOrder[];
  loans: Loan[];
  promotions: Promotion[];
  upgrades: string[];
  storeHours: { open: number; close: number };
  dailyLog: { time: string; message: string }[];
  financialHistory: FinancialRecord[];
  activeEffects: { eventId: string; effect: { type: string; value: number; durationDays: number }; remainingDays: number }[];
}

export interface ItemSold {
  productId: string;
  quantity: number;
  revenue: number;
}

export interface ExpiredItem {
  productId: string;
  quantity: number;
}

export interface Settlement {
  revenue: number;
  expenses: number;
  netProfit: number;
  customerCount: number;
  itemsSold: ItemSold[];
  expiredItems: ExpiredItem[];
  events?: { id: string; name: string; description: string; severity: string }[];
  summary: string;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
}

export interface DayData {
  day: number;
  morningBrief: string;
  toolCalls: ToolCall[];
  settlement: Settlement;
  stateSnapshot: StateSnapshot;
}

export interface SimulationResult {
  id: string;
  model: string;
  scenario: string;
  startedAt: string;
  completedAt: string;
  finalScore: number;
  metrics: {
    netProfit: number;
    finalCash: number;
    inventoryValue: number;
    outstandingLoans: number;
    cashFlowBreakDays: number;
    inventoryWasteRate: number;
    bankruptcyTriggered: boolean;
    totalToolCalls: number;
    avgDailyProfit: number;
    customerSatisfactionTrend: number[];
    reputationTrend: number[];
    dailyProfitTrend: number[];
  };
  days: DayData[];
}

/* ─── Derived Metrics ─── */

export interface DerivedMetrics {
  totalRevenue: number;
  totalCOGS: number;
  grossMargin: number;
  totalWages: number;
  totalRent: number;
  totalPurchaseSpend: number;
  ordersAttempted: number;
  ordersFailed: number;
  failureRate: number;
  spendByPhase: { early: number; mid: number; late: number };
  setPriceCalls: number;
  revenuePerCustomer: number;
  endInventoryValue: number;
  totalExpired: number;
  inventoryClearanceRate: number;
  hires: number;
  fires: number;
  employeeCountTrend: number[];
  callsByType: Record<string, number>;
  errorsByType: Record<string, number>;
  callsPerDay: number[];
  errorsPerDay: number[];
  errorRate: number;
  last5DaysPurchases: number;
  last5DaysPromotions: number;
  clearanceRate: number;
  dailyRevenue: number[];
  dailyCash: number[];
  dailyInventoryValue: number[];
  dailyCustomerCount: number[];
  dailyCOGS: number[];
  salesByProduct: Record<string, number>;
  expiredByProduct: Record<string, number>;
}

export interface AggregatedLeaderboardEntry {
  model: string;
  displayName: string;
  runCount: number;
  positiveRunCount: number;
  positiveRunRate: number;
  trimmedMeanFinalScore: number;
  medianFinalScore: number;
  finalScoreIqr: number;
  medianGrossMargin: number;
  medianErrorRate: number;
  stabilityBand: "stable" | "medium" | "volatile";
  medianRunId: string;
  bestRunId: string;
  worstRunId: string;
}

export function computeDerivedMetrics(result: SimulationResult): DerivedMetrics {
  const { days } = result;

  let totalRevenue = 0;
  let totalCOGS = 0;
  let totalWages = 0;
  let totalRent = 0;

  const lastDay = days[days.length - 1];
  const fh = lastDay?.stateSnapshot?.financialHistory ?? [];
  for (const rec of fh) {
    totalRevenue += rec.revenue;
    totalCOGS += rec.costOfGoods;
    totalWages += rec.wages;
    totalRent += rec.rent;
  }
  if (fh.length === 0) {
    for (const d of days) {
      totalRevenue += d.settlement.revenue;
    }
  }
  const grossMargin = totalRevenue > 0 ? (totalRevenue - totalCOGS) / totalRevenue : 0;

  let totalPurchaseSpend = 0;
  let ordersAttempted = 0;
  let ordersFailed = 0;
  const spendByPhase = { early: 0, mid: 0, late: 0 };
  let setPriceCalls = 0;
  let totalCustomers = 0;
  let hires = 0;
  let fires = 0;
  let totalExpired = 0;
  let last5DaysPurchases = 0;
  let last5DaysPromotions = 0;

  const callsByType: Record<string, number> = {};
  const errorsByType: Record<string, number> = {};
  const callsPerDay: number[] = [];
  const errorsPerDay: number[] = [];
  const dailyRevenue: number[] = [];
  const dailyCash: number[] = [];
  const dailyInventoryValue: number[] = [];
  const dailyCustomerCount: number[] = [];
  const dailyCOGS: number[] = [];
  const employeeCountTrend: number[] = [];
  const salesByProduct: Record<string, number> = {};
  const expiredByProduct: Record<string, number> = {};

  for (const d of days) {
    let dayErrors = 0;
    for (const tc of d.toolCalls) {
      callsByType[tc.name] = (callsByType[tc.name] ?? 0) + 1;
      const isError = typeof tc.result === "object" && tc.result !== null && "error" in (tc.result as Record<string, unknown>);
      if (isError) {
        errorsByType[tc.name] = (errorsByType[tc.name] ?? 0) + 1;
        dayErrors++;
      }
      if (tc.name === "purchase_goods") {
        ordersAttempted++;
        if (isError) {
          ordersFailed++;
        } else {
          const res = tc.result as Record<string, unknown>;
          const cost = typeof res.totalCost === "number" ? res.totalCost : 0;
          totalPurchaseSpend += cost;
          const phase = d.day <= 10 ? "early" : d.day <= 20 ? "mid" : "late";
          spendByPhase[phase] += cost;
          if (d.day > 25) last5DaysPurchases++;
        }
      }
      if (tc.name === "set_price") setPriceCalls++;
      if (tc.name === "hire_employee" && !isError) hires++;
      if (tc.name === "fire_employee" && !isError) fires++;
      if (tc.name === "run_promotion" && d.day > 25 && !isError) last5DaysPromotions++;
    }
    callsPerDay.push(d.toolCalls.length);
    errorsPerDay.push(dayErrors);

    totalCustomers += d.settlement.customerCount;
    dailyRevenue.push(d.settlement.revenue);
    dailyCustomerCount.push(d.settlement.customerCount);

    const dayFH = fh.find(f => f.day === d.day);
    dailyCOGS.push(dayFH?.costOfGoods ?? 0);

    const ss = d.stateSnapshot;
    if (ss) {
      dailyCash.push(ss.cash);
      const invValue = ss.inventory.reduce((sum, it) => sum + it.quantity * it.costPerUnit, 0);
      dailyInventoryValue.push(invValue);
      employeeCountTrend.push(ss.employees.length);
    } else {
      dailyCash.push(0);
      dailyInventoryValue.push(0);
      employeeCountTrend.push(0);
    }

    for (const item of d.settlement.itemsSold) {
      salesByProduct[item.productId] = (salesByProduct[item.productId] ?? 0) + item.revenue;
    }
    for (const item of d.settlement.expiredItems) {
      totalExpired += item.quantity;
      expiredByProduct[item.productId] = (expiredByProduct[item.productId] ?? 0) + item.quantity;
    }
  }

  const revenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const endInventoryValue = dailyInventoryValue[dailyInventoryValue.length - 1] ?? 0;
  const totalToolCalls = Object.values(callsByType).reduce((a, b) => a + b, 0);
  const totalErrors = Object.values(errorsByType).reduce((a, b) => a + b, 0);
  const errorRate = totalToolCalls > 0 ? totalErrors / totalToolCalls : 0;
  const failureRate = ordersAttempted > 0 ? ordersFailed / ordersAttempted : 0;

  const initialInvValue = days[0]?.stateSnapshot?.inventory?.reduce((s, it) => s + it.quantity * it.costPerUnit, 0) ?? 0;
  const inventoryClearanceRate = initialInvValue > 0 ? 1 - endInventoryValue / initialInvValue : 1;

  return {
    totalRevenue, totalCOGS, grossMargin, totalWages, totalRent,
    totalPurchaseSpend, ordersAttempted, ordersFailed, failureRate, spendByPhase,
    setPriceCalls, revenuePerCustomer, endInventoryValue, totalExpired, inventoryClearanceRate,
    hires, fires, employeeCountTrend,
    callsByType, errorsByType, callsPerDay, errorsPerDay, errorRate,
    last5DaysPurchases, last5DaysPromotions, clearanceRate: inventoryClearanceRate,
    dailyRevenue, dailyCash, dailyInventoryValue, dailyCustomerCount, dailyCOGS,
    salesByProduct, expiredByProduct,
  };
}

/* ─── Helpers ─── */

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  "anthropic/claude-sonnet-4.6": "Claude Sonnet 4.6",
  "google/gemini-3-flash-preview": "Gemini 3 Flash",
  "qwen/qwen3.5-plus-02-15": "Qwen 3.5 Plus",
  "openai/gpt-4o": "GPT-4o",
  "openai/o3-mini": "o3-mini",
  "meta-llama/llama-4-maverick": "Llama 4 Maverick",
  "deepseek-v4-pro": "DeepSeek V4 Pro",
};

export function getModelDisplayName(model: string): string {
  const normalized = model.toLowerCase();
  if ((normalized.startsWith("anthropic/claude-") || normalized.startsWith("claude-")) && normalized.endsWith("-thinking")) {
    return model.split("/").pop() ?? model;
  }
  const raw = MODEL_DISPLAY_NAMES[model] ?? model.split("/").pop() ?? model;
  return raw
    .replace(/xhgih/gi, "xhigh")
    .replace(/-hgih\b/gi, "-high");
}

const MODEL_COLORS: string[] = [
  "#60a5fa", "#10b981", "#f59e0b", "#ef4444", "#a78bfa", "#ec4899", "#06b6d4", "#84cc16",
];

export function getModelColor(index: number): string {
  return MODEL_COLORS[index % MODEL_COLORS.length];
}

export const TOOL_CATEGORIES: Record<string, { label: string; category: string }> = {
  check_inventory: { label: "Check Inventory", category: "info" },
  view_financials: { label: "View Financials", category: "info" },
  view_sales_history: { label: "View Sales History", category: "info" },
  view_suppliers: { label: "View Suppliers", category: "info" },
  view_pending_orders: { label: "Pending Orders", category: "info" },
  view_employee_status: { label: "Employee Status", category: "info" },
  view_customer_feedback: { label: "Customer Feedback", category: "info" },
  view_competitors: { label: "View Competitors", category: "info" },
  check_market_trends: { label: "Market Trends", category: "info" },
  check_weather_forecast: { label: "Weather Forecast", category: "info" },
  estimate_order: { label: "Estimate Order", category: "info" },
  purchase_goods: { label: "Purchase Goods", category: "operation" },
  set_price: { label: "Set Price", category: "operation" },
  dispose_goods: { label: "Dispose Goods", category: "operation" },
  adjust_store_hours: { label: "Store Hours", category: "operation" },
  hire_employee: { label: "Hire Employee", category: "personnel" },
  fire_employee: { label: "Fire Employee", category: "personnel" },
  assign_shift: { label: "Assign Shift", category: "personnel" },
  run_promotion: { label: "Run Promotion", category: "strategy" },
  launch_marketing: { label: "Launch Marketing", category: "strategy" },
  negotiate_supplier: { label: "Negotiate Supplier", category: "strategy" },
};

export function getToolCategory(name: string): string {
  return TOOL_CATEGORIES[name]?.category ?? "info";
}

export function getToolLabel(name: string): string {
  return TOOL_CATEGORIES[name]?.label ?? name;
}

/* ─── Currency Formatting ─── */

export function formatYen(value: number): string {
  const abs = Math.abs(value);
  let formatted: string;
  if (abs >= 1000) {
    const rounded = Math.round(abs).toString();
    // Add thousands separators manually to avoid locale mismatch
    formatted = rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  } else {
    formatted = abs.toFixed(2);
  }
  return `${value < 0 ? "-" : ""}¥${formatted}`;
}

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
