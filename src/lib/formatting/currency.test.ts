import { describe, expect, it } from "vitest";
import { addPesewas, cedisToPesewas, formatPesewas, parseGhsToPesewas, subtractPesewas } from "./currency";

describe("GHS amount handling", () => {
  it("parses decimal text directly into integer pesewas", () => {
    expect(parseGhsToPesewas("250")).toBe(25_000);
    expect(parseGhsToPesewas("1000.05")).toBe(100_005);
    expect(parseGhsToPesewas("0.1")).toBe(10);
  });

  it("rejects malformed, negative, over-precision and unsafe amounts", () => {
    expect(parseGhsToPesewas("1.001")).toBeNull();
    expect(parseGhsToPesewas("-1.00")).toBeNull();
    expect(parseGhsToPesewas("1e3")).toBeNull();
    expect(parseGhsToPesewas("90071992547410.00")).toBeNull();
  });

  it("keeps financial calculations in integer pesewas", () => {
    expect(cedisToPesewas(250)).toBe(25_000);
    expect(addPesewas(25_000, 75_000)).toBe(100_000);
    expect(subtractPesewas(100_000, 25_000)).toBe(75_000);
    expect(formatPesewas(25_000)).toContain("250.00");
  });
});
