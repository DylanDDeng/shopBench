/**
 * Seeded pseudo-random number generator (mulberry32).
 * Deterministic: same seed always produces the same sequence.
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  /** Returns a float in [0, 1), like Math.random() */
  random(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Create a derived RNG (consumes one call to generate child seed) */
  fork(): SeededRNG {
    return new SeededRNG(Math.floor(this.random() * 2147483647));
  }
}
