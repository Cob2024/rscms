import { describe, it, expect } from "vitest";
import {
  pesewasToCedis,
  cedisToPesewas,
  parseGhsToPesewas,
  formatPesewas,
  formatPesewasCompact,
  isValidPesewas,
  addPesewas,
  subtractPesewas,
} from "../../src/lib/formatting/currency";

describe("Ghana Cedis (GHS) Currency Utilities", () => {
  describe("pesewasToCedis", () => {
    it("converts 25,000 pesewas to 250 cedis", () => {
      expect(pesewasToCedis(25000)).toBe(250);
    });

    it("converts 100,000 pesewas to 1,000 cedis", () => {
      expect(pesewasToCedis(100000)).toBe(1000);
    });

    it("converts 50 pesewas to 0.5 cedis", () => {
      expect(pesewasToCedis(50)).toBe(0.5);
    });
  });

  describe("cedisToPesewas", () => {
    it("converts 250 cedis to 25,000 pesewas", () => {
      expect(cedisToPesewas(250)).toBe(25000);
    });

    it("converts 1000 cedis to 100,000 pesewas", () => {
      expect(cedisToPesewas(1000)).toBe(100000);
    });

    it("converts 0.50 cedis to 50 pesewas", () => {
      expect(cedisToPesewas(0.5)).toBe(50);
    });

    it("throws error for non-finite values", () => {
      expect(() => cedisToPesewas(NaN)).toThrow(RangeError);
      expect(() => cedisToPesewas(Infinity)).toThrow(RangeError);
    });

    it("throws error for values with more than two decimal places", () => {
      expect(() => cedisToPesewas(10.125)).toThrow(RangeError);
    });
  });

  describe("parseGhsToPesewas", () => {
    it("parses whole cedi string '250' to 25000", () => {
      expect(parseGhsToPesewas("250")).toBe(25000);
    });

    it("parses cedi string with cents '250.50' to 25050", () => {
      expect(parseGhsToPesewas("250.50")).toBe(25050);
    });

    it("parses single decimal place '250.5' as 50 pesewas (25050)", () => {
      expect(parseGhsToPesewas("250.5")).toBe(25050);
    });

    it("returns null for invalid string", () => {
      expect(parseGhsToPesewas("abc")).toBeNull();
      expect(parseGhsToPesewas("250.123")).toBeNull();
      expect(parseGhsToPesewas("-100")).toBeNull();
    });
  });

  describe("formatPesewas", () => {
    it("formats 25,000 pesewas with GH currency symbol", () => {
      const formatted = formatPesewas(25000);
      expect(formatted).toContain("250.00");
    });

    it("formats 100,000 pesewas with GH currency symbol", () => {
      const formatted = formatPesewas(100000);
      expect(formatted).toContain("1,000.00");
    });
  });

  describe("formatPesewasCompact", () => {
    it("formats 25000 as 250.00", () => {
      expect(formatPesewasCompact(25000)).toBe("250.00");
    });

    it("formats 100000 as 1000.00", () => {
      expect(formatPesewasCompact(100000)).toBe("1000.00");
    });
  });

  describe("isValidPesewas", () => {
    it("validates positive integers", () => {
      expect(isValidPesewas(25000)).toBe(true);
      expect(isValidPesewas(1)).toBe(true);
    });

    it("rejects zero, negative numbers, floats, and non-integers", () => {
      expect(isValidPesewas(0)).toBe(false);
      expect(isValidPesewas(-100)).toBe(false);
      expect(isValidPesewas(250.5)).toBe(false);
      expect(isValidPesewas(NaN)).toBe(false);
    });
  });

  describe("Safe Integer Arithmetic", () => {
    it("safely adds pesewas without floating point drift", () => {
      // 4 members contributing 25,000 pesewas each = 100,000 pesewas
      const total = addPesewas(25000, 25000, 25000, 25000);
      expect(total).toBe(100000);
    });

    it("safely subtracts payout from collected funds", () => {
      // 100,000 pesewas collection - 100,000 pesewas payout = 0
      const remaining = subtractPesewas(100000, 100000);
      expect(remaining).toBe(0);
    });

    it("calculates partial payment shortfall accurately", () => {
      // Expected 25,000 pesewas, paid 10,000 pesewas -> shortfall 15,000 pesewas
      const shortfall = subtractPesewas(25000, 10000);
      expect(shortfall).toBe(15000);
    });
  });
});

