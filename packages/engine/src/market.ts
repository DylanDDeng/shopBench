import type {
  Supplier,
  Competitor,
  MarketTrend,
  PurchaseOrder,
  ProductDef,
  ActiveEffect,
} from "./types.js";
import type { SeededRNG } from "./rng.js";
import { randomUUID } from "node:crypto";

export class MarketManager {
  private suppliers: Supplier[];
  private competitors: Competitor[];
  private products: ProductDef[];
  private trends: Map<string, MarketTrend> = new Map();
  private rng: SeededRNG;

  constructor(suppliers: Supplier[], competitors: Competitor[], products: ProductDef[], rng: SeededRNG) {
    this.suppliers = suppliers;
    this.competitors = [...competitors];
    this.products = products;
    this.rng = rng;
    this.initTrends();
  }

  private initTrends(): void {
    for (const p of this.products) {
      this.trends.set(p.id, {
        productId: p.id,
        demandTrend: "stable",
        priceDirection: "stable",
        note: "Market conditions are normal.",
      });
    }
  }

  getSuppliers(): Supplier[] {
    return this.suppliers;
  }

  getSupplier(id: string): Supplier | undefined {
    return this.suppliers.find(s => s.id === id);
  }

  getCompetitors(): Competitor[] {
    return this.competitors;
  }

  getTrends(): MarketTrend[] {
    return [...this.trends.values()];
  }

  /** Place a purchase order with a supplier */
  placeOrder(
    supplierId: string,
    items: { productId: string; quantity: number }[],
    currentDay: number,
    activeEffects: ActiveEffect[],
  ): PurchaseOrder {
    const supplier = this.suppliers.find(s => s.id === supplierId);
    if (!supplier) throw new Error(`Supplier ${supplierId} not found`);

    const orderItems = items.map(item => {
      const product = this.products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (!supplier.products.includes(item.productId)) {
        throw new Error(`Supplier ${supplierId} does not carry ${item.productId}`);
      }

      let unitCost = product.baseCost * supplier.priceMultiplier;

      // Apply cost multiplier effects
      const costEffects = activeEffects.filter(
        e => e.effect.type === "cost_multiplier" &&
          (!e.effect.target || e.effect.target === item.productId || e.effect.target === product.category)
      );
      for (const ce of costEffects) {
        unitCost *= ce.effect.value;
      }

      return { productId: item.productId, quantity: item.quantity, unitCost: Math.round(unitCost * 100) / 100 };
    });

    const totalCost = orderItems.reduce((s, i) => s + i.unitCost * i.quantity, 0);
    if (totalCost < supplier.minOrderAmount) {
      throw new Error(
        `Order total ¥${totalCost.toFixed(2)} below minimum ¥${supplier.minOrderAmount} for supplier "${supplier.name}". ` +
        `Try adding more items or increasing quantity. Use view_suppliers to see all supplier requirements.`
      );
    }

    // Delivery delay: check supply disruption effects
    let deliveryDays = supplier.deliveryDays;
    const disruptionEffects = activeEffects.filter(e => e.effect.type === "supply_disruption");
    if (disruptionEffects.length > 0) {
      deliveryDays += Math.ceil(deliveryDays * 0.5); // 50% longer delivery
    }

    // Reliability check — might arrive late
    if (this.rng.random() > supplier.reliability) {
      deliveryDays += 1 + Math.floor(this.rng.random() * 2);
    }

    const order: PurchaseOrder = {
      id: randomUUID(),
      supplierId,
      items: orderItems,
      totalCost: Math.round(totalCost * 100) / 100,
      orderDay: currentDay,
      expectedArrivalDay: currentDay + deliveryDays,
      arrived: false,
    };

    return order;
  }

  /** Negotiate with supplier — may improve price multiplier */
  negotiateSupplier(supplierId: string, proposedTerms: string): { success: boolean; message: string } {
    const supplier = this.suppliers.find(s => s.id === supplierId);
    if (!supplier) throw new Error(`Supplier ${supplierId} not found`);

    // Simple negotiation: 40% chance of success, reduces price by 5-10%
    const success = this.rng.random() < 0.4;
    if (success) {
      const reduction = 0.05 + this.rng.random() * 0.05;
      supplier.priceMultiplier = Math.max(0.7, supplier.priceMultiplier - reduction);
      return {
        success: true,
        message: `Negotiation successful! ${supplier.name} agreed to reduce prices by ${(reduction * 100).toFixed(1)}%. New multiplier: ${supplier.priceMultiplier.toFixed(2)}x`,
      };
    }

    return {
      success: false,
      message: `${supplier.name} declined your proposal. They suggest increasing order volume for better terms.`,
    };
  }

  /** Update market trends (called each day) */
  updateTrends(day: number): void {
    for (const product of this.products) {
      const trend = this.trends.get(product.id)!;
      const r = this.rng.random();

      if (r < 0.15) {
        trend.demandTrend = "rising";
        trend.priceDirection = "up";
        trend.note = `Demand for ${product.name} is increasing.`;
      } else if (r < 0.3) {
        trend.demandTrend = "falling";
        trend.priceDirection = "down";
        trend.note = `Demand for ${product.name} is softening.`;
      } else {
        trend.demandTrend = "stable";
        trend.priceDirection = "stable";
        trend.note = `${product.name} market is stable.`;
      }
    }
  }

  /** Simulate competitor actions */
  updateCompetitors(day: number): void {
    for (const comp of this.competitors) {
      // Random promotion toggle
      if (!comp.promotionActive && this.rng.random() < 0.1) {
        comp.promotionActive = true;
        comp.promotionDiscount = 10 + Math.floor(this.rng.random() * 20);
      } else if (comp.promotionActive && this.rng.random() < 0.3) {
        comp.promotionActive = false;
        comp.promotionDiscount = 0;
      }

      // Reputation drift
      comp.reputation = Math.max(20, Math.min(95, comp.reputation + (this.rng.random() - 0.5) * 4));
    }
  }

  snapshot() {
    return {
      suppliers: structuredClone(this.suppliers),
      competitors: structuredClone(this.competitors),
      trends: [...this.trends.values()],
    };
  }
}
