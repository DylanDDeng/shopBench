import type {
  CustomerSegment,
  CustomerFeedback,
  InventoryItem,
  Promotion,
  Weather,
  ActiveEffect,
  StoreUpgrade,
} from "./types.js";
import type { SeededRNG } from "./rng.js";

interface SaleRecord {
  productId: string;
  quantity: number;
  revenue: number;
  unitPrice: number;
}

interface DailyCustomerResult {
  totalCustomers: number;
  sales: SaleRecord[];
  missedSales: { productId: string; demandedQty: number }[];
  feedback: CustomerFeedback;
}

export class CustomerSimulator {
  private segments: CustomerSegment[];
  private baseFootfall: number;
  private rng: SeededRNG;

  constructor(segments: CustomerSegment[], rng: SeededRNG, baseFootfall = 80) {
    this.segments = segments;
    this.rng = rng;
    this.baseFootfall = baseFootfall;
  }

  simulateDay(params: {
    day: number;
    weather: Weather;
    isWeekend: boolean;
    holiday: string | null;
    reputation: number;
    satisfaction: number;
    inventory: InventoryItem[];
    promotions: Promotion[];
    storeHours: { open: number; close: number };
    activeEffects: ActiveEffect[];
    upgrades: StoreUpgrade[];
    serviceQuality: number;
    getEffectivePrice: (productId: string) => number;
    removeStock: (productId: string, qty: number) => number;
  }): DailyCustomerResult {
    const {
      day, weather, isWeekend, holiday, reputation, satisfaction,
      inventory, promotions, storeHours, activeEffects, upgrades, serviceQuality,
      getEffectivePrice, removeStock,
    } = params;

    // Calculate total footfall
    let footfall = this.baseFootfall;
    footfall *= this.weatherMultiplier(weather);
    if (isWeekend) footfall *= 1.3;
    if (holiday) footfall *= 1.5;
    footfall *= (reputation / 100) * 1.2 + 0.4; // rep 0→0.4x, 50→1.0x, 100→1.6x
    footfall *= (storeHours.close - storeHours.open) / 14; // normalized to 14-hour day

    // Demand multiplier from active effects
    const globalDemandMult = activeEffects
      .filter(e => e.effect.type === "demand_multiplier" && !e.effect.target)
      .reduce((m, e) => m * e.effect.value, 1);
    footfall *= globalDemandMult;

    // Decoration upgrade boosts footfall
    if (upgrades.some(u => u.type === "decoration")) footfall *= 1.1;
    footfall *= serviceQuality;

    footfall = Math.round(footfall + (this.rng.random() - 0.5) * footfall * 0.2);
    if (footfall < 0) footfall = 0;

    // Build product demand map
    const productDemand = new Map<string, number>();
    const availableProducts = new Map<string, number>();

    for (const item of inventory) {
      const current = availableProducts.get(item.productId) ?? 0;
      availableProducts.set(item.productId, current + item.quantity);
    }

    // Each customer picks 1-3 products based on segment preferences
    for (let i = 0; i < footfall; i++) {
      const segment = this.pickSegment();
      const itemsToBuy = 1 + Math.floor(this.rng.random() * 3);

      for (let j = 0; j < itemsToBuy; j++) {
        const productId = this.pickProduct(segment, [...availableProducts.keys()]);
        if (!productId) continue;

        const price = getEffectivePrice(productId);
        // Price sensitivity check
        const willBuy = this.rng.random() > segment.priceElasticity * (price > 10 ? 0.3 : 0.1);
        if (!willBuy) continue;

        const qty = (productDemand.get(productId) ?? 0) + 1;
        productDemand.set(productId, qty);
      }
    }

    // Fulfill demand from inventory
    const sales: SaleRecord[] = [];
    const missedSales: { productId: string; demandedQty: number }[] = [];

    for (const [productId, demanded] of productDemand) {
      const price = getEffectivePrice(productId);
      const sold = removeStock(productId, demanded);

      if (sold > 0) {
        sales.push({
          productId,
          quantity: sold,
          revenue: sold * price,
          unitPrice: price,
        });
      }

      if (sold < demanded) {
        missedSales.push({ productId, demandedQty: demanded - sold });
      }
    }

    // Generate feedback
    const feedback = this.generateFeedback(day, sales, missedSales, satisfaction, promotions);

    return { totalCustomers: footfall, sales, missedSales, feedback };
  }

  private weatherMultiplier(weather: Weather): number {
    const map: Record<Weather, number> = {
      sunny: 1.1,
      cloudy: 1.0,
      rainy: 0.7,
      stormy: 0.4,
      snowy: 0.5,
    };
    return map[weather];
  }

  private pickSegment(): CustomerSegment {
    const r = this.rng.random();
    let cumulative = 0;
    for (const seg of this.segments) {
      cumulative += seg.proportion;
      if (r <= cumulative) return seg;
    }
    return this.segments[this.segments.length - 1];
  }

  private pickProduct(segment: CustomerSegment, available: string[]): string | null {
    if (available.length === 0) return null;
    // Prefer products in preferred categories (simplified: just pick random from available)
    const preferred = available.filter(id =>
      segment.preferredCategories.some(cat => id.includes(cat))
    );
    const pool = preferred.length > 0 ? preferred : available;
    return pool[Math.floor(this.rng.random() * pool.length)];
  }

  private generateFeedback(
    day: number,
    sales: SaleRecord[],
    missedSales: { productId: string; demandedQty: number }[],
    currentSatisfaction: number,
    promotions: Promotion[],
  ): CustomerFeedback {
    const complaints: string[] = [];
    const suggestions: string[] = [];

    if (missedSales.length > 3) {
      complaints.push("Many items were out of stock today.");
    }
    if (missedSales.length > 0) {
      const topMissed = missedSales.sort((a, b) => b.demandedQty - a.demandedQty)[0];
      suggestions.push(`Customers are looking for more ${topMissed.productId}.`);
    }

    const avgPrice = sales.length > 0
      ? sales.reduce((s, r) => s + r.unitPrice, 0) / sales.length
      : 0;
    if (avgPrice > 15) {
      complaints.push("Some customers feel prices are too high.");
    }

    if (promotions.length > 0) {
      suggestions.push("Promotions are attracting attention.");
    }

    // Satisfaction delta
    let satDelta = 0;
    if (missedSales.length === 0) satDelta += 2;
    if (missedSales.length > 5) satDelta -= 3;
    if (avgPrice > 15) satDelta -= 1;
    const satisfaction = Math.max(0, Math.min(100, currentSatisfaction + satDelta));

    return { day, satisfaction, complaints, suggestions };
  }
}
