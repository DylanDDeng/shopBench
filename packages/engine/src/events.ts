import type { GameEvent, EventEffect, EventSeverity, ActiveEffect } from "./types.js";
import type { SeededRNG } from "./rng.js";

export class EventEngine {
  private pool: GameEvent[];
  private firedIds: Set<string> = new Set();
  private rng: SeededRNG;
  private schedule: Map<number, GameEvent[]> = new Map();

  constructor(eventPool: GameEvent[], rng: SeededRNG) {
    this.pool = eventPool;
    this.rng = rng;
  }

  /** Pre-generate events for all days so the schedule is deterministic */
  preGenerateSchedule(totalDays: number): void {
    for (let day = 1; day <= totalDays; day++) {
      this.schedule.set(day, this.rollEvents());
    }
  }

  /** Get pre-generated events for a specific day */
  getEventsForDay(day: number): GameEvent[] {
    return this.schedule.get(day) ?? [];
  }

  /** Roll events for the day based on severity probabilities */
  rollEvents(): GameEvent[] {
    const triggered: GameEvent[] = [];

    for (const event of this.pool) {
      if (this.firedIds.has(event.id) && event.severity === "extreme") continue;

      const prob = this.getProbability(event.severity);
      if (this.rng.random() < prob) {
        triggered.push(event);
        if (event.severity === "extreme") this.firedIds.add(event.id);
      }
    }

    // Cap: max 1 major/extreme per day
    const majorOrExtreme = triggered.filter(e => e.severity === "major" || e.severity === "extreme");
    if (majorOrExtreme.length > 1) {
      const keep = majorOrExtreme[Math.floor(this.rng.random() * majorOrExtreme.length)];
      return triggered.filter(e => (e.severity !== "major" && e.severity !== "extreme") || e.id === keep.id);
    }

    return triggered;
  }

  private getProbability(severity: EventSeverity): number {
    switch (severity) {
      case "daily": return 0.8;
      case "normal": return 0.15;
      case "major": return 0.05;
      case "extreme": return 0.01;
    }
  }

  /** Convert triggered events into active effects */
  activateEvents(events: GameEvent[]): ActiveEffect[] {
    return events.flatMap(event =>
      event.effects.map(effect => ({
        eventId: event.id,
        effect,
        remainingDays: effect.durationDays,
      }))
    );
  }

  /** Tick down active effects, remove expired ones */
  tickEffects(activeEffects: ActiveEffect[]): ActiveEffect[] {
    return activeEffects
      .map(ae => ({ ...ae, remainingDays: ae.remainingDays - 1 }))
      .filter(ae => ae.remainingDays > 0);
  }
}

// ─── Built-in Event Pool ───

export const DEFAULT_EVENT_POOL: GameEvent[] = [
  // Daily events
  {
    id: "evt_foot_traffic_surge",
    name: "Foot Traffic Surge",
    description: "A nearby event brings extra foot traffic to the area.",
    severity: "daily",
    effects: [{ type: "demand_multiplier", value: 1.2, durationDays: 1 }],
  },
  {
    id: "evt_slow_day",
    name: "Slow Day",
    description: "Fewer people are out today.",
    severity: "daily",
    effects: [{ type: "demand_multiplier", value: 0.8, durationDays: 1 }],
  },

  // Normal events
  {
    id: "evt_supplier_price_hike",
    name: "Supplier Price Hike",
    description: "A major supplier raises prices by 15% due to raw material costs.",
    severity: "normal",
    effects: [{ type: "cost_multiplier", value: 1.15, durationDays: 5 }],
  },
  {
    id: "evt_competitor_promotion",
    name: "Competitor Promotion",
    description: "A nearby competitor launches an aggressive promotion campaign.",
    severity: "normal",
    effects: [{ type: "demand_multiplier", value: 0.85, durationDays: 3 }],
  },
  {
    id: "evt_positive_review",
    name: "Positive Online Review",
    description: "A customer posts a glowing review on social media.",
    severity: "normal",
    effects: [{ type: "reputation_change", value: 5, durationDays: 1 }],
  },
  {
    id: "evt_negative_review",
    name: "Negative Online Review",
    description: "A dissatisfied customer complains publicly.",
    severity: "normal",
    effects: [{ type: "reputation_change", value: -5, durationDays: 1 }],
  },
  {
    id: "evt_bulk_order",
    name: "Bulk Order Request",
    description: "A local business wants to place a bulk order for snacks and drinks.",
    severity: "normal",
    effects: [{ type: "demand_multiplier", target: "snack", value: 1.5, durationDays: 2 }],
  },

  // Major events
  {
    id: "evt_health_inspection",
    name: "Health Inspection",
    description: "The health department conducts a surprise inspection. Expired goods will result in fines.",
    severity: "major",
    effects: [{ type: "cash_change", value: -500, durationDays: 1 }],
  },
  {
    id: "evt_supply_chain_disruption",
    name: "Supply Chain Disruption",
    description: "A logistics issue delays all deliveries by 2+ days.",
    severity: "major",
    effects: [{ type: "supply_disruption", value: 1, durationDays: 4 }],
  },
  {
    id: "evt_rent_increase_notice",
    name: "Rent Increase Notice",
    description: "Landlord announces a 10% rent increase starting next month.",
    severity: "major",
    effects: [{ type: "cash_change", value: -200, durationDays: 1 }],
  },
  {
    id: "evt_employee_conflict",
    name: "Employee Conflict",
    description: "Two employees have a disagreement, affecting team morale.",
    severity: "major",
    effects: [{ type: "employee_morale", value: -15, durationDays: 3 }],
  },

  // Extreme events
  {
    id: "evt_flood",
    name: "Flash Flood",
    description: "Heavy rains cause flooding. Store is closed for 2 days, some inventory damaged.",
    severity: "extreme",
    effects: [
      { type: "demand_multiplier", value: 0, durationDays: 2 },
      { type: "cash_change", value: -2000, durationDays: 1 },
    ],
  },
  {
    id: "evt_viral_moment",
    name: "Viral Social Media Moment",
    description: "Your store goes viral on social media! Massive foot traffic incoming.",
    severity: "extreme",
    effects: [
      { type: "demand_multiplier", value: 2.5, durationDays: 3 },
      { type: "reputation_change", value: 20, durationDays: 1 },
    ],
  },
];
