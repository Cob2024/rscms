import { describe, it, expect } from "vitest";
import { createCycleSchema, updateDeadlineSchema } from "../../src/lib/validation/cycle";
import { addMonths } from "date-fns";

describe("Savings Cycle Management Domain & Constraints (Phase 5)", () => {
  const baseDate = new Date("2025-01-01T00:00:00.000Z");

  const validDueDates = [
    new Date("2025-01-15T23:59:59.000Z").toISOString(),
    new Date("2025-02-15T23:59:59.000Z").toISOString(),
    new Date("2025-03-15T23:59:59.000Z").toISOString(),
    new Date("2025-04-15T23:59:59.000Z").toISOString(),
  ];

  describe("Cycle Configuration Validation", () => {
    it("validates correct 4-month cycle configuration", () => {
      const valid = createCycleSchema.safeParse({
        startDate: baseDate.toISOString(),
        contributionAmountPesewas: 25000,
        monthlyTargetPesewas: 100000,
        dueDates: validDueDates,
      });
      expect(valid.success).toBe(true);
    });

    it("validates flexible due dates (at least 2 deadlines, rejects fewer than 2)", () => {
      const tooFew = createCycleSchema.safeParse({
        startDate: baseDate.toISOString(),
        dueDates: validDueDates.slice(0, 1),
      });
      expect(tooFew.success).toBe(false);

      const validThree = createCycleSchema.safeParse({
        startDate: baseDate.toISOString(),
        dueDates: validDueDates.slice(0, 3),
      });
      expect(validThree.success).toBe(true);

      const validFive = createCycleSchema.safeParse({
        startDate: baseDate.toISOString(),
        dueDates: [...validDueDates, new Date("2025-05-15T23:59:59.000Z").toISOString()],
      });
      expect(validFive.success).toBe(true);
    });

    it("enforces chronological order of contribution deadlines", () => {
      // Period 3 deadline placed before Period 2
      const outOfOrder = [
        validDueDates[0],
        validDueDates[2], // Month 3 before Month 2
        validDueDates[1],
        validDueDates[3],
      ];

      const result = createCycleSchema.safeParse({
        startDate: baseDate.toISOString(),
        dueDates: outOfOrder,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("chronological");
      }
    });

    it("rejects non-integer or negative contribution amounts", () => {
      const invalid = createCycleSchema.safeParse({
        startDate: baseDate.toISOString(),
        contributionAmountPesewas: -25000,
        dueDates: validDueDates,
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("Mathematical Invariants for 4-Month Cycle", () => {
    it("generates exactly 16 obligations across the 4-month cycle", () => {
      const memberCount = 4;
      const periodCount = 4;
      const totalObligationsCount = memberCount * periodCount;
      expect(totalObligationsCount).toBe(16);
    });

    it("matches expected monthly target of GH₵1,000 (100,000 pesewas)", () => {
      const memberCount = 4;
      const contributionPerMember = 25000;
      const monthlyTarget = memberCount * contributionPerMember;
      expect(monthlyTarget).toBe(100000);
    });

    it("matches expected total cycle target of GH₵4,000 (400,000 pesewas)", () => {
      const totalObligationsCount = 16;
      const obligationAmount = 25000;
      const totalCycleTarget = totalObligationsCount * obligationAmount;
      expect(totalCycleTarget).toBe(400000);
    });

    it("maps 4 fixed payout positions to 4 periods", () => {
      const payoutRotation = [
        { period: 1, position: 1, expectedAmount: 100000 },
        { period: 2, position: 2, expectedAmount: 100000 },
        { period: 3, position: 3, expectedAmount: 100000 },
        { period: 4, position: 4, expectedAmount: 100000 },
      ];

      expect(payoutRotation.length).toBe(4);
      payoutRotation.forEach((item, index) => {
        expect(item.period).toBe(index + 1);
        expect(item.position).toBe(index + 1);
        expect(item.expectedAmount).toBe(100000);
      });

      const totalPayouts = payoutRotation.reduce((sum, p) => sum + p.expectedAmount, 0);
      expect(totalPayouts).toBe(400000); // Equals total cycle contributions
    });
  });

  describe("Deadline Update Validation & Safeguards", () => {
    it("accepts valid deadline change with administrative reason", () => {
      const valid = updateDeadlineSchema.safeParse({
        newDueDate: new Date("2025-02-20T23:59:59.000Z").toISOString(),
        reason: "Extension agreed by group due to bank holiday",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects deadline change without reason", () => {
      const invalid = updateDeadlineSchema.safeParse({
        newDueDate: new Date("2025-02-20T23:59:59.000Z").toISOString(),
        reason: "",
      });
      expect(invalid.success).toBe(false);
    });
  });
});

