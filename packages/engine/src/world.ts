import type {
  WorldState,
  ScenarioConfig,
  Weather,
  LogEntry,
  SettlementResult,
  DayRecord,
  Promotion,
  StoreUpgrade,
  UpgradeType,
  MarketingChannel,
  ActiveEffect,
  GameEvent,
} from "./types.js";
import { InventoryManager } from "./inventory.js";
import { FinanceManager } from "./finance.js";
import { CustomerSimulator } from "./customers.js";
import { MarketManager } from "./market.js";
import { EmployeeManager } from "./employees.js";
import { EventEngine } from "./events.js";
import { SeededRNG } from "./rng.js";

const UPGRADE_COSTS: Record<UpgradeType, number> = {
  refrigerator: 3000,
  shelving: 1500,
  decoration: 2000,
  security: 2500,
  pos_system: 1800,
};

const MARKETING_COSTS: Record<MarketingChannel, number> = {
  flyers: 100,
  social_media: 300,
  local_newspaper: 500,
  loudspeaker: 50,
};

export class World {
  private config: ScenarioConfig;
  private day = 0;
  private weather: Weather = "sunny";
  private holiday: string | null = null;

  private inventory: InventoryManager;
  private finance: FinanceManager;
  private customers: CustomerSimulator;
  private market: MarketManager;
  private employees: EmployeeManager;
  private events: EventEngine;

  private promotions: Promotion[] = [];
  private upgrades: StoreUpgrade[] = [];
  private storeHours = { open: 7, close: 21 };
  private reputation = 50;
  private customerSatisfaction = 60;
  private activeEffects: ActiveEffect[] = [];
  private dailyLog: LogEntry[] = [];

  private history: DayRecord[] = [];

  constructor(config: ScenarioConfig) {
    this.config = config;

    // Create seeded RNG (default seed 42 if not specified)
    const rng = new SeededRNG(config.seed ?? 42);

    // Fork a dedicated RNG for events before other subsystems consume the main RNG.
    // This ensures the event schedule is deterministic regardless of model decisions.
    const eventRng = rng.fork();

    // Initialize inventory from scenario
    const initialItems = config.initialInventory.map(ii => {
      const product = config.products.find(p => p.id === ii.productId)!;
      return {
        productId: ii.productId,
        quantity: ii.quantity,
        costPerUnit: product.baseCost,
        price: product.basePrice,
        expiryDay: product.shelfLifeDays,
        batchId: `init_${ii.productId}`,
      };
    });

    this.inventory = new InventoryManager(initialItems);
    this.finance = new FinanceManager(config.startingCash, config.monthlyRent);
    this.customers = new CustomerSimulator(config.customerSegments, rng);
    this.market = new MarketManager(config.suppliers, config.competitors, config.products, rng);
    this.employees = new EmployeeManager(config.initialEmployees, rng);
    this.events = new EventEngine(config.eventPool, eventRng);

    // Pre-generate the full event schedule so it's identical for all models with the same seed
    this.events.preGenerateSchedule(config.totalDays);
  }

  getDay(): number { return this.day; }
  getTotalDays(): number { return this.config.totalDays; }
  getMaxToolCalls(): number { return this.config.maxToolCallsPerDay; }

  /** Advance to next day and generate morning brief */
  generateMorningBrief(): string {
    this.day++;
    this.dailyLog = [];

    // Set weather
    this.weather = this.config.weatherPattern[(this.day - 1) % this.config.weatherPattern.length];
    this.holiday = this.config.holidays.find(h => h.day === this.day)?.name ?? null;

    // Process arriving orders
    const arrivals = this.processArrivals();

    // Get pre-generated events for this day
    const todayEvents = this.events.getEventsForDay(this.day);

    // Activate new effects
    const newEffects = this.events.activateEvents(todayEvents);
    this.activeEffects.push(...newEffects);

    // Apply immediate effects
    for (const ae of newEffects) {
      if (ae.effect.type === "cash_change") {
        if (ae.effect.value < 0) {
          try { this.finance.spend(Math.abs(ae.effect.value)); } catch { /* can go negative in extreme */ }
        } else {
          this.finance.earn(ae.effect.value);
        }
      }
      if (ae.effect.type === "reputation_change") {
        this.reputation = clamp(this.reputation + ae.effect.value, 0, 100);
      }
      if (ae.effect.type === "employee_morale") {
        this.employees.applyMoraleChange(ae.effect.value);
      }
    }

    // Update market
    this.market.updateTrends(this.day);
    this.market.updateCompetitors(this.day);

    // Build brief
    const lines: string[] = [
      `═══ Day ${this.day}/${this.config.totalDays} Morning Brief ═══`,
      `Weather: ${this.weather}${this.holiday ? ` | Holiday: ${this.holiday}` : ""}`,
      `${this.isWeekend() ? "Weekend" : "Weekday"}`,
      `Cash: ¥${this.finance.cash.toFixed(2)}`,
      `Reputation: ${this.reputation}/100 | Satisfaction: ${this.customerSatisfaction}/100`,
      "",
    ];

    if (arrivals.length > 0) {
      lines.push("📦 Deliveries arrived:");
      for (const a of arrivals) lines.push(`  - ${a}`);
      lines.push("");
    }

    if (todayEvents.length > 0) {
      lines.push("📰 Today's events:");
      for (const e of todayEvents) lines.push(`  - [${e.severity.toUpperCase()}] ${e.name}: ${e.description}`);
      lines.push("");
    }

    const expiring = this.getExpiringItems(3);
    if (expiring.length > 0) {
      lines.push("⚠️ Items expiring within 3 days:");
      for (const e of expiring) lines.push(`  - ${e.productId}: ${e.quantity} units (day ${e.expiryDay})`);
      lines.push("");
    }

    lines.push(`Employees on duty: ${this.employees.getAll().length}`);
    lines.push(`Active promotions: ${this.promotions.filter(p => this.day >= p.startDay && this.day <= p.endDay).length}`);

    // Pending orders
    const pending = this.pendingOrders.filter(o => !o.arrived);
    if (pending.length > 0) {
      lines.push("");
      lines.push("🚚 Pending orders (in transit):");
      for (const o of pending) {
        const itemDesc = o.items.map(i => `${i.quantity}x ${i.productId}`).join(", ");
        lines.push(`  - ${itemDesc} | ¥${o.totalCost.toFixed(2)} | ETA: day ${o.expectedArrivalDay}`);
      }
    }

    // Daily fixed costs reminder
    const totalWages = this.employees.getAll().reduce((s, e) => s + e.dailyWage, 0);
    const dailyFixed = totalWages + this.finance.dailyRent;
    lines.push("");
    lines.push(`💰 Daily fixed costs: ¥${dailyFixed.toFixed(2)} (wages ¥${totalWages.toFixed(2)} + rent ¥${this.finance.dailyRent.toFixed(2)})`);

    // Loan due reminders
    const loansDueSoon = this.finance.loans.filter(l => (l.startDay + l.termDays) - this.day <= 5);
    if (loansDueSoon.length > 0) {
      lines.push("");
      lines.push("⚠️ Loans due within 5 days:");
      for (const l of loansDueSoon) {
        const dueDay = l.startDay + l.termDays;
        const daysLeft = dueDay - this.day;
        lines.push(`  - Loan ${l.id.slice(0, 8)}...: ¥${l.remainingBalance.toFixed(2)} remaining, due day ${dueDay} (${daysLeft} days left)`);
      }
    }

    const brief = lines.join("\n");
    this.log("morning", brief);
    return brief;
  }

  /** Settle the day — simulate customers, calculate finances */
  settleDay(): SettlementResult {
    // Expire items
    const expired = this.inventory.expireItems(this.day);

    // Simulate customers
    const customerResult = this.customers.simulateDay({
      day: this.day,
      weather: this.weather,
      isWeekend: this.isWeekend(),
      holiday: this.holiday,
      reputation: this.reputation,
      satisfaction: this.customerSatisfaction,
      inventory: this.inventory.getAllItems(),
      promotions: this.promotions,
      storeHours: this.storeHours,
      activeEffects: this.activeEffects,
      upgrades: this.upgrades,
      serviceQuality: this.employees.getServiceQuality(),
      getEffectivePrice: (pid) => this.inventory.getEffectivePrice(pid, this.promotions, this.day),
      removeStock: (pid, qty) => this.inventory.removeStock(pid, qty),
    });

    // Update satisfaction
    this.customerSatisfaction = customerResult.feedback.satisfaction;

    // Employee processing
    const empResult = this.employees.processDaily();
    for (const evt of empResult.events) this.log("day", evt);

    // Calculate financials
    const revenue = customerResult.sales.reduce((s, r) => s + r.revenue, 0);
    const cogs = customerResult.sales.reduce(
      (s, r) => s + r.quantity * this.getProductCost(r.productId), 0
    );

    const record = this.finance.processDaily(
      this.day,
      revenue,
      cogs,
      empResult.totalWages,
      0, // marketing already deducted when launched
      0,
    );

    // Tick active effects
    this.activeEffects = this.events.tickEffects(this.activeEffects);

    // Clean up expired promotions
    this.promotions = this.promotions.filter(p => this.day <= p.endDay);

    const todayEvents = this.activeEffects
      .map(ae => this.config.eventPool.find(e => e.id === ae.eventId)!)
      .filter(Boolean);

    const result: SettlementResult = {
      revenue,
      expenses: record.costOfGoods + record.wages + record.rent + record.loanInterest + record.marketingSpend + record.otherExpenses,
      netProfit: record.netProfit,
      customerCount: customerResult.totalCustomers,
      itemsSold: customerResult.sales.map(s => ({ productId: s.productId, quantity: s.quantity, revenue: s.revenue })),
      expiredItems: expired,
      events: [...new Map(todayEvents.map(e => [e.id, e])).values()],
      summary: this.buildSettlementSummary(record, customerResult.totalCustomers, customerResult.sales.length, expired.length),
    };

    this.log("settlement", result.summary);

    // Save day record
    this.history.push({
      day: this.day,
      morningBrief: this.dailyLog.find(l => l.time === "morning")?.message ?? "",
      toolCalls: [],
      settlement: result,
      stateSnapshot: this.snapshot(),
    });

    return result;
  }

  // ─── Tool Execution Methods ───

  checkInventory() {
    const details = this.inventory.getInventoryDetails();
    const result: Record<string, { totalQty: number; avgCost: number; price: number; batches: number; earliestExpiry: number | null; expiringWithin3Days: number }> = {};
    for (const [pid, items] of Object.entries(details)) {
      const totalQty = items.reduce((s, i) => s + i.quantity, 0);
      const avgCost = items.reduce((s, i) => s + i.costPerUnit * i.quantity, 0) / (totalQty || 1);
      const expiryDays = items.map(i => i.expiryDay - this.day).filter(d => d > 0);
      const earliestExpiry = expiryDays.length > 0 ? Math.min(...expiryDays) : null;
      const expiringWithin3Days = items
        .filter(i => i.expiryDay - this.day <= 3 && i.expiryDay > this.day)
        .reduce((s, i) => s + i.quantity, 0);
      result[pid] = {
        totalQty,
        avgCost: Math.round(avgCost * 100) / 100,
        price: this.inventory.getEffectivePrice(pid, this.promotions, this.day),
        batches: items.length,
        earliestExpiry,
        expiringWithin3Days,
      };
    }
    return result;
  }

  viewFinancials() {
    const totalWages = this.employees.getAll().reduce((s, e) => s + e.dailyWage, 0);
    const dailyFixedCosts = totalWages + this.finance.dailyRent;
    const pendingOrdersCost = this.pendingOrders
      .filter(o => !o.arrived)
      .reduce((s, o) => s + o.totalCost, 0);
    const loansDueSoon = this.finance.loans
      .filter(l => (l.startDay + l.termDays) - this.day <= 5)
      .map(l => ({
        id: l.id,
        remaining: Math.round(l.remainingBalance * 100) / 100,
        dueDay: l.startDay + l.termDays,
        daysUntilDue: (l.startDay + l.termDays) - this.day,
      }));
    return {
      cash: this.finance.cash,
      outstandingLoans: this.finance.getOutstandingLoans(),
      loans: this.finance.loans.map(l => ({
        id: l.id,
        remaining: l.remainingBalance,
        dueDay: l.startDay + l.termDays,
      })),
      recentDays: this.finance.getFinancialSummary(7),
      inventoryValue: this.inventory.getTotalValue(),
      dailyFixedCosts,
      pendingOrdersCost,
      loansDueSoon,
    };
  }

  checkMarketTrends() {
    return this.market.getTrends();
  }

  viewCustomerFeedback() {
    const lastRecord = this.history[this.history.length - 1];
    return {
      satisfaction: this.customerSatisfaction,
      reputation: this.reputation,
      recentCustomerCount: lastRecord?.settlement.customerCount ?? 0,
      missedSalesYesterday: lastRecord?.settlement.itemsSold.length ?? 0,
    };
  }

  viewCompetitors() {
    return this.market.getCompetitors();
  }

  checkWeatherForecast() {
    const forecast: { day: number; weather: Weather }[] = [];
    for (let i = 0; i < 3; i++) {
      const d = this.day + i;
      if (d > this.config.totalDays) break;
      forecast.push({
        day: d,
        weather: this.config.weatherPattern[(d - 1) % this.config.weatherPattern.length],
      });
    }
    return forecast;
  }

  viewEmployeeStatus() {
    return this.employees.getAll().map(e => ({
      id: e.id,
      name: e.name,
      role: e.role,
      shift: e.shift,
      morale: Math.round(e.morale),
      skill: Math.round(e.skill),
      dailyWage: e.dailyWage,
    }));
  }

  viewSuppliers() {
    return this.market.getSuppliers().map(s => ({
      id: s.id,
      name: s.name,
      tier: s.tier,
      products: s.products.map(pid => {
        const product = this.config.products.find(p => p.id === pid);
        const unitCost = product ? Math.round(product.baseCost * s.priceMultiplier * 100) / 100 : 0;
        return { id: pid, unitCost };
      }),
      deliveryDays: s.deliveryDays,
      reliability: s.reliability,
      minOrderAmount: s.minOrderAmount,
    }));
  }

  estimateOrder(productId: string, quantity: number, supplierId?: string) {
    const product = this.config.products.find(p => p.id === productId);
    if (!product) throw new Error(`Unknown product: ${productId}`);

    const suppliers = this.market.getSuppliers().filter(s => s.products.includes(productId));
    const supplier = supplierId
      ? suppliers.find(s => s.id === supplierId)
      : suppliers[0];
    if (!supplier) throw new Error(`No supplier found for ${productId}`);

    const unitCost = Math.round(product.baseCost * supplier.priceMultiplier * 100) / 100;
    const totalCost = Math.round(unitCost * quantity * 100) / 100;
    const meetsMinimum = totalCost >= supplier.minOrderAmount;

    return {
      supplier: supplier.name,
      supplierId: supplier.id,
      productId,
      quantity,
      unitCost,
      totalCost,
      minOrderAmount: supplier.minOrderAmount,
      meetsMinimum,
      deliveryDays: supplier.deliveryDays,
    };
  }

  viewPendingOrders() {
    return this.pendingOrders
      .filter(o => !o.arrived)
      .map(o => ({
        orderId: o.id,
        supplierId: o.supplierId,
        items: o.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        totalCost: o.totalCost,
        orderDay: o.orderDay,
        expectedArrivalDay: o.expectedArrivalDay,
      }));
  }

  viewSalesHistory() {
    const lookback = Math.min(7, this.history.length);
    const recentDays = this.history.slice(-lookback);
    const productStats: Record<string, { totalSold: number; totalRevenue: number; stockoutDays: number }> = {};

    for (const dayRecord of recentDays) {
      const soldProducts = new Set<string>();
      for (const sale of dayRecord.settlement.itemsSold) {
        if (!productStats[sale.productId]) {
          productStats[sale.productId] = { totalSold: 0, totalRevenue: 0, stockoutDays: 0 };
        }
        productStats[sale.productId].totalSold += sale.quantity;
        productStats[sale.productId].totalRevenue += sale.revenue;
        soldProducts.add(sale.productId);
      }
      // Check for stockouts: products with 0 inventory in snapshot
      for (const item of dayRecord.stateSnapshot.inventory) {
        if (!productStats[item.productId]) {
          productStats[item.productId] = { totalSold: 0, totalRevenue: 0, stockoutDays: 0 };
        }
      }
    }

    // Count stockout days from snapshots
    for (const dayRecord of recentDays) {
      const inventoryByProduct: Record<string, number> = {};
      for (const item of dayRecord.stateSnapshot.inventory) {
        inventoryByProduct[item.productId] = (inventoryByProduct[item.productId] ?? 0) + item.quantity;
      }
      for (const pid of Object.keys(productStats)) {
        if ((inventoryByProduct[pid] ?? 0) === 0) {
          productStats[pid].stockoutDays++;
        }
      }
    }

    return {
      daysAnalyzed: lookback,
      products: Object.entries(productStats).map(([productId, stats]) => ({
        productId,
        totalSold: stats.totalSold,
        dailyAvgSold: lookback > 0 ? Math.round((stats.totalSold / lookback) * 10) / 10 : 0,
        totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
        stockoutDays: stats.stockoutDays,
      })),
    };
  }

  purchaseGoods(productId: string, quantity: number, supplierId?: string) {
    const product = this.config.products.find(p => p.id === productId);
    if (!product) throw new Error(`Unknown product: ${productId}`);

    const suppliers = this.market.getSuppliers().filter(s => s.products.includes(productId));
    const supplier = supplierId
      ? suppliers.find(s => s.id === supplierId)
      : suppliers[0];
    if (!supplier) throw new Error(`No supplier found for ${productId}`);

    const order = this.market.placeOrder(supplier.id, [{ productId, quantity }], this.day, this.activeEffects);

    if (!this.finance.canAfford(order.totalCost)) {
      throw new Error(`Cannot afford order: ¥${order.totalCost.toFixed(2)}, cash: ¥${this.finance.cash.toFixed(2)}`);
    }
    this.finance.spend(order.totalCost);

    // Store as pending order (will arrive later)
    this.pendingOrders.push(order);
    this.log("day", `Ordered ${quantity}x ${product.name} from ${supplier.name} for ¥${order.totalCost.toFixed(2)}. ETA: day ${order.expectedArrivalDay}`);

    return {
      orderId: order.id,
      totalCost: order.totalCost,
      expectedArrival: order.expectedArrivalDay,
      supplier: supplier.name,
    };
  }

  setPrice(productId: string, price: number) {
    const items = this.inventory.getAllItems().filter(i => i.productId === productId);
    if (items.length === 0) throw new Error(`No inventory for ${productId}`);
    for (const item of items) item.price = price;
    this.log("day", `Set price of ${productId} to ¥${price.toFixed(2)}`);
    return { productId, newPrice: price };
  }

  runPromotion(productId: string, discountPct: number, durationDays: number) {
    if (discountPct < 1 || discountPct > 80) throw new Error("Discount must be 1-80%");
    const promo: Promotion = {
      productId,
      discountPct,
      startDay: this.day,
      endDay: this.day + durationDays - 1,
    };
    this.promotions.push(promo);
    this.log("day", `Started ${discountPct}% promotion on ${productId} for ${durationDays} days`);
    return promo;
  }

  adjustStoreHours(open: number, close: number) {
    if (open < 0 || close > 24 || open >= close) throw new Error("Invalid hours");
    this.storeHours = { open, close };
    this.log("day", `Store hours adjusted to ${open}:00 - ${close}:00`);
    return this.storeHours;
  }

  disposeGoods(productId: string, quantity: number) {
    const disposed = this.inventory.disposeItems(productId, quantity);
    this.log("day", `Disposed ${disposed} units of ${productId}`);
    return { productId, disposed };
  }

  hireEmployee(role: string, wage: number) {
    const emp = this.employees.hire(role as any, wage);
    this.log("day", `Hired ${emp.name} as ${role} at ¥${wage}/day`);
    return { id: emp.id, name: emp.name, role: emp.role };
  }

  fireEmployee(employeeId: string) {
    const emp = this.employees.fire(employeeId);
    this.log("day", `Fired ${emp.name}`);
    return { name: emp.name, role: emp.role };
  }

  assignShift(employeeId: string, shift: string) {
    this.employees.assignShift(employeeId, shift as any);
    return { employeeId, shift };
  }

  takeLoan(amount: number, termDays: number) {
    if (amount < 100 || amount > 50000) throw new Error("Loan amount must be ¥100-50000");
    if (termDays < 5 || termDays > 30) throw new Error("Loan term must be 5-30 days");
    const loan = this.finance.takeLoan(amount, termDays, this.day);
    this.log("day", `Took loan of ¥${amount} for ${termDays} days`);
    return { loanId: loan.id, amount, termDays, dailyInterestRate: loan.dailyInterestRate };
  }

  repayLoan(loanId: string, amount: number) {
    const remaining = this.finance.repayLoan(loanId, amount);
    this.log("day", `Repaid ¥${amount} on loan ${loanId.slice(0, 8)}... Remaining: ¥${remaining.toFixed(2)}`);
    return { loanId, repaid: amount, remaining };
  }

  negotiateSupplier(supplierId: string, proposedTerms: string) {
    const result = this.market.negotiateSupplier(supplierId, proposedTerms);
    this.log("day", result.message);
    return result;
  }

  upgradeStore(upgradeType: UpgradeType) {
    if (this.upgrades.some(u => u.type === upgradeType)) {
      throw new Error(`Already have ${upgradeType} upgrade`);
    }
    const cost = UPGRADE_COSTS[upgradeType];
    if (!cost) throw new Error(`Unknown upgrade: ${upgradeType}`);
    this.finance.spend(cost);
    const upgrade: StoreUpgrade = {
      type: upgradeType,
      cost,
      installedDay: this.day,
      effect: `${upgradeType} installed`,
    };
    this.upgrades.push(upgrade);
    this.log("day", `Installed ${upgradeType} upgrade for ¥${cost}`);
    return upgrade;
  }

  launchMarketing(channel: MarketingChannel, budget: number) {
    const baseCost = MARKETING_COSTS[channel];
    if (!baseCost) throw new Error(`Unknown channel: ${channel}`);
    const totalCost = Math.max(baseCost, budget);
    this.finance.spend(totalCost);

    // Marketing boosts reputation
    const boost = Math.min(10, totalCost / 100);
    this.reputation = clamp(this.reputation + boost, 0, 100);
    this.log("day", `Launched ${channel} marketing campaign (¥${totalCost}). Reputation +${boost.toFixed(1)}`);
    return { channel, cost: totalCost, reputationBoost: boost };
  }

  // ─── Internal Helpers ───

  private get pendingOrders() {
    return this._pendingOrders ??= [];
  }
  private _pendingOrders: import("./types.js").PurchaseOrder[] | undefined;

  private processArrivals(): string[] {
    const messages: string[] = [];
    for (const order of this.pendingOrders) {
      if (!order.arrived && this.day >= order.expectedArrivalDay) {
        order.arrived = true;
        for (const item of order.items) {
          const product = this.config.products.find(p => p.id === item.productId)!;
          this.inventory.addStock(
            item.productId,
            item.quantity,
            item.unitCost,
            this.day + product.shelfLifeDays,
            product.basePrice,
          );
          messages.push(`${item.quantity}x ${product.name} from order ${order.id.slice(0, 8)}...`);
        }
      }
    }
    // Clean up arrived orders
    this._pendingOrders = this.pendingOrders.filter(o => !o.arrived);
    return messages;
  }

  private isWeekend(): boolean {
    return this.day % 7 === 6 || this.day % 7 === 0;
  }

  private getExpiringItems(withinDays: number) {
    return this.inventory.getAllItems()
      .filter(i => i.expiryDay - this.day <= withinDays && i.expiryDay > this.day)
      .map(i => ({ productId: i.productId, quantity: i.quantity, expiryDay: i.expiryDay }));
  }

  private getProductCost(productId: string): number {
    const product = this.config.products.find(p => p.id === productId);
    return product?.baseCost ?? 0;
  }

  private log(time: LogEntry["time"], message: string) {
    this.dailyLog.push({ time, message });
  }

  private buildSettlementSummary(
    record: import("./types.js").FinancialRecord,
    customers: number,
    salesCount: number,
    expiredCount: number,
  ): string {
    return [
      `═══ Day ${this.day} Settlement ═══`,
      `Customers: ${customers} | Transactions: ${salesCount}`,
      `Revenue: ¥${record.revenue.toFixed(2)} | COGS: ¥${record.costOfGoods.toFixed(2)}`,
      `Wages: ¥${record.wages.toFixed(2)} | Rent: ¥${record.rent.toFixed(2)}`,
      `Net Profit: ¥${record.netProfit.toFixed(2)}`,
      `Cash Balance: ¥${record.cashBalance.toFixed(2)}`,
      expiredCount > 0 ? `⚠️ ${expiredCount} item types expired today` : "",
      `Reputation: ${this.reputation}/100 | Satisfaction: ${this.customerSatisfaction}/100`,
    ].filter(Boolean).join("\n");
  }

  /** Full state snapshot for replay */
  snapshot(): WorldState {
    return structuredClone({
      day: this.day,
      weather: this.weather,
      isWeekend: this.isWeekend(),
      holiday: this.holiday,
      cash: this.finance.cash,
      inventory: this.inventory.snapshot(),
      employees: this.employees.snapshot(),
      reputation: this.reputation,
      customerSatisfaction: this.customerSatisfaction,
      pendingOrders: this.pendingOrders,
      loans: this.finance.loans,
      promotions: this.promotions,
      upgrades: this.upgrades,
      storeHours: this.storeHours,
      dailyLog: this.dailyLog,
      financialHistory: this.finance.history,
      activeEffects: this.activeEffects,
    });
  }

  getHistory(): DayRecord[] {
    return this.history;
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
