// ─── Enums & Literals ───

export type Weather = "sunny" | "cloudy" | "rainy" | "stormy" | "snowy";

export type Shift = "morning" | "afternoon" | "evening" | "full_day";

export type EmployeeRole = "cashier" | "stocker" | "cleaner" | "manager";

export type UpgradeType = "refrigerator" | "shelving" | "decoration" | "security" | "pos_system";

export type MarketingChannel = "flyers" | "social_media" | "local_newspaper" | "loudspeaker";

export type EventSeverity = "daily" | "normal" | "major" | "extreme";

export type SupplierTier = "budget" | "standard" | "premium";

// ─── Inventory ───

export interface ProductDef {
  id: string;
  name: string;
  category: "food" | "drink" | "snack" | "daily_necessity" | "tobacco_alcohol";
  basePrice: number;          // 建议零售价
  baseCost: number;           // 基础进货价
  shelfLifeDays: number;      // 保质期（天）
  dailyDemandBase: number;    // 基础日需求量
  weatherSensitivity: Partial<Record<Weather, number>>;  // 天气对需求的乘数
  weekendMultiplier: number;  // 周末需求乘数
}

export interface InventoryItem {
  productId: string;
  quantity: number;
  costPerUnit: number;        // 实际进货单价
  price: number;              // 当前售价
  expiryDay: number;          // 过期日（绝对天数）
  batchId: string;            // 批次 ID
}

// ─── Finance ───

export interface Loan {
  id: string;
  principal: number;
  remainingBalance: number;
  dailyInterestRate: number;
  termDays: number;
  startDay: number;
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

// ─── Employees ───

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  dailyWage: number;
  morale: number;             // 0-100
  skill: number;              // 0-100, affects efficiency
  shift: Shift;
  daysEmployed: number;
}

// ─── Customers ───

export interface CustomerSegment {
  id: string;
  name: string;               // e.g. "students", "elderly", "office_workers"
  proportion: number;         // 占比
  priceElasticity: number;    // 价格敏感度 (0-1, higher = more sensitive)
  preferredCategories: string[];
  peakHours: number[];        // 高峰时段
}

export interface CustomerFeedback {
  day: number;
  satisfaction: number;
  complaints: string[];
  suggestions: string[];
}

// ─── Market & Suppliers ───

export interface Supplier {
  id: string;
  name: string;
  tier: SupplierTier;
  products: string[];         // product IDs they supply
  priceMultiplier: number;    // 相对 baseCost 的乘数
  deliveryDays: number;       // 配送天数
  reliability: number;        // 0-1, 准时率
  minOrderAmount: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  items: { productId: string; quantity: number; unitCost: number }[];
  totalCost: number;
  orderDay: number;
  expectedArrivalDay: number;
  arrived: boolean;
}

export interface Competitor {
  id: string;
  name: string;
  priceLevel: "low" | "medium" | "high";
  promotionActive: boolean;
  promotionDiscount: number;
  reputation: number;
}

export interface MarketTrend {
  productId: string;
  demandTrend: "rising" | "stable" | "falling";
  priceDirection: "up" | "stable" | "down";
  note: string;
}

// ─── Events ───

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  severity: EventSeverity;
  effects: EventEffect[];
}

export interface EventEffect {
  type:
    | "demand_multiplier"
    | "cost_multiplier"
    | "reputation_change"
    | "cash_change"
    | "supply_disruption"
    | "employee_morale"
    | "customer_satisfaction";
  target?: string;            // product ID or category, if applicable
  value: number;
  durationDays: number;
}

// ─── Store Upgrades ───

export interface StoreUpgrade {
  type: UpgradeType;
  cost: number;
  installedDay: number;
  effect: string;             // human-readable description
}

// ─── Promotion ───

export interface Promotion {
  productId: string;
  discountPct: number;        // 0-100
  startDay: number;
  endDay: number;
}

// ─── World State ───

export interface WorldState {
  day: number;
  weather: Weather;
  isWeekend: boolean;
  holiday: string | null;
  cash: number;
  inventory: InventoryItem[];
  employees: Employee[];
  reputation: number;         // 0-100
  customerSatisfaction: number; // 0-100
  pendingOrders: PurchaseOrder[];
  loans: Loan[];
  promotions: Promotion[];
  upgrades: StoreUpgrade[];
  storeHours: { open: number; close: number };
  dailyLog: LogEntry[];
  financialHistory: FinancialRecord[];
  activeEffects: ActiveEffect[];
}

export interface ActiveEffect {
  eventId: string;
  effect: EventEffect;
  remainingDays: number;
}

export interface LogEntry {
  time: "morning" | "day" | "evening" | "settlement";
  message: string;
}

// ─── Scenario Config ───

export interface ScenarioConfig {
  name: string;
  description: string;
  totalDays: number;
  startingCash: number;
  monthlyRent: number;
  maxToolCallsPerDay: number;
  products: ProductDef[];
  suppliers: Supplier[];
  competitors: Competitor[];
  customerSegments: CustomerSegment[];
  initialInventory: { productId: string; quantity: number }[];
  initialEmployees: Omit<Employee, "id" | "daysEmployed">[];
  eventPool: GameEvent[];
  holidays: { day: number; name: string }[];
  weatherPattern: Weather[];  // 30-day weather sequence (or seed)
  seed?: number;
  inventoryLiquidationRate?: number;  // 期末库存折价率，默认 0（不算库存）
}

// ─── Simulation Record (for replay) ───

export interface DayRecord {
  day: number;
  morningBrief: string;
  toolCalls: ToolCallRecord[];
  settlement: SettlementResult;
  stateSnapshot: WorldState;
}

export interface ToolCallRecord {
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
}

export interface SettlementResult {
  revenue: number;
  expenses: number;
  netProfit: number;
  customerCount: number;
  itemsSold: { productId: string; quantity: number; revenue: number }[];
  expiredItems: { productId: string; quantity: number }[];
  events: GameEvent[];
  summary: string;
}

export interface SimulationResult {
  id: string;
  model: string;
  scenario: string;
  startedAt: string;
  completedAt: string;
  days: DayRecord[];
  finalScore: number;
  metrics: SimulationMetrics;
}

export interface SimulationMetrics {
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
}
