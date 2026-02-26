import type { InventoryItem, Promotion } from "./types.js";
import { randomUUID } from "node:crypto";

export class InventoryManager {
  private items: InventoryItem[];

  constructor(initialItems: InventoryItem[]) {
    this.items = initialItems.map(item => ({ ...item }));
  }

  addStock(productId: string, quantity: number, costPerUnit: number, expiryDay: number, price?: number): string {
    const batchId = randomUUID();
    this.items.push({
      productId,
      quantity,
      costPerUnit,
      price: price ?? costPerUnit,
      expiryDay,
      batchId,
    });
    return batchId;
  }

  removeStock(productId: string, quantity: number): number {
    const batches = this.items
      .filter(i => i.productId === productId && i.quantity > 0)
      .sort((a, b) => a.expiryDay - b.expiryDay);

    let remaining = quantity;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantity, remaining);
      batch.quantity -= take;
      remaining -= take;
    }
    this.items = this.items.filter(i => i.quantity > 0);
    return quantity - remaining;
  }

  getStock(productId: string): number {
    return this.items.filter(i => i.productId === productId).reduce((s, i) => s + i.quantity, 0);
  }

  getInventoryDetails(): Record<string, InventoryItem[]> {
    const grouped: Record<string, InventoryItem[]> = {};
    for (const item of this.items) {
      (grouped[item.productId] ??= []).push({ ...item });
    }
    return grouped;
  }

  getEffectivePrice(productId: string, promotions: Promotion[], day: number): number {
    const batches = this.items.filter(i => i.productId === productId);
    if (batches.length === 0) return 0;
    const basePrice = batches[batches.length - 1].price;

    const activePromos = promotions.filter(
      p => p.productId === productId && day >= p.startDay && day <= p.endDay,
    );
    if (activePromos.length === 0) return basePrice;

    const bestDiscount = Math.max(...activePromos.map(p => p.discountPct));
    return +(basePrice * (1 - bestDiscount / 100)).toFixed(2);
  }

  expireItems(currentDay: number): { productId: string; quantity: number }[] {
    const expired: Record<string, number> = {};
    for (const item of this.items) {
      if (item.expiryDay <= currentDay) {
        expired[item.productId] = (expired[item.productId] ?? 0) + item.quantity;
        item.quantity = 0;
      }
    }
    this.items = this.items.filter(i => i.quantity > 0);
    return Object.entries(expired).map(([productId, quantity]) => ({ productId, quantity }));
  }

  disposeItems(productId: string, quantity: number): number {
    return this.removeStock(productId, quantity);
  }

  getTotalValue(): number {
    return this.items.reduce((s, i) => s + i.quantity * i.costPerUnit, 0);
  }

  getAllItems(): InventoryItem[] {
    return this.items;
  }

  snapshot(): InventoryItem[] {
    return this.items.map(i => ({ ...i }));
  }
}
