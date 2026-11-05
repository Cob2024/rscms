import { describe, expect, it } from "vitest";
import { deriveContributionStatus } from "./contribution-status";

const due = new Date("2026-11-15T00:00:00.000Z");
const before = new Date("2026-11-14T23:59:59.000Z");
const after = new Date("2026-11-15T00:00:01.000Z");

describe("deriveContributionStatus", () => {
  it("keeps unpaid and partial obligations pending until the deadline", () => {
    expect(deriveContributionStatus(25_000, 0, due, before)).toBe("PENDING");
    expect(deriveContributionStatus(25_000, 10_000, due, before)).toBe("PARTIAL");
  });

  it("marks only unpaid balances overdue after the deadline", () => {
    expect(deriveContributionStatus(25_000, 0, due, after)).toBe("OVERDUE");
    expect(deriveContributionStatus(25_000, 10_000, due, after)).toBe("OVERDUE_PARTIAL");
    expect(deriveContributionStatus(25_000, 25_000, due, after)).toBe("PAID");
  });

  it("rejects invalid pesewa balances", () => {
    expect(() => deriveContributionStatus(0, 0, due, before)).toThrow(RangeError);
    expect(() => deriveContributionStatus(25_000, -1, due, before)).toThrow(RangeError);
  });
});
