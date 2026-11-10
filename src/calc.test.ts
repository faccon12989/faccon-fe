import { describe, expect, it } from "vitest";
import { adjust, pct, won } from "./calc";
import { CONTRACTS } from "./data";
import type { Contract } from "./types";

const al001 = CONTRACTS.find((c) => c.id === "AL-001") as Contract;

describe("adjust", () => {
  it("reproduces the plan's appendix A example: 10,000 → 10,320, diff 320,000", () => {
    const r = adjust(al001);
    expect(r.triggered).toBe(true);
    expect(r.price).toBe(10320);
    expect(r.total).toBe(320000);
  });

  it("does not adjust when change is below the threshold", () => {
    const r = adjust(al001, 104.9);
    expect(r.triggered).toBe(false);
    expect(r.price).toBe(al001.p0);
    expect(r.total).toBe(0);
  });

  it("triggers exactly at the ±5% boundary in both directions", () => {
    expect(adjust(al001, 105).triggered).toBe(true);
    expect(adjust(al001, 95).triggered).toBe(true);
    expect(adjust(al001, 95).price).toBe(9800);
  });

  it("returns a negative total for a price decrease", () => {
    expect(adjust(al001, 92).total).toBeLessThan(0);
  });
});

describe("formatters", () => {
  it("formats won and percent", () => {
    expect(won(320000)).toBe("320,000원");
    expect(won(null)).toBe("-");
    expect(pct(0.08)).toBe("8.0%");
  });
});
