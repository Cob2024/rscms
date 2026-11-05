import { describe, it, expect } from "vitest";
import { deriveContributionStatus } from "../../src/lib/financial/contribution-status";
import { addPesewas, subtractPesewas } from "../../src/lib/formatting/currency";

describe("Contribution Management & Status Rules (Phase 6)", () => {
  const obligationAmount = 25000; // GH₵250 in pesewas
  const dueDate = new Date("2025-02-15T23:59:59.000Z");
  const beforeDeadline = new Date("2025-02-10T12:00:00.000Z");
  const afterDeadline = new Date("2025-02-16T12:00:00.000Z");

  describe("Scenario 1: No Payment", () => {
    it("derives PENDING status before the deadline", () => {
      const status = deriveContributionStatus(obligationAmount, 0, dueDate, beforeDeadline);
      expect(status).toBe("PENDING");
    });

    it("derives OVERDUE status after the deadline passes", () => {
      const status = deriveContributionStatus(obligationAmount, 0, dueDate, afterDeadline);
      expect(status).toBe("OVERDUE");
    });

    it("maintains full outstanding balance of 25,000 pesewas", () => {
      const outstanding = subtractPesewas(obligationAmount, 0);
      expect(outstanding).toBe(25000);
    });
  });

  describe("Scenario 2: Single Partial Payment", () => {
    const partialPaid = 10000; // GH₵100 in pesewas

    it("derives PARTIAL status before deadline", () => {
      const status = deriveContributionStatus(obligationAmount, partialPaid, dueDate, beforeDeadline);
      expect(status).toBe("PARTIAL");
    });

    it("derives OVERDUE_PARTIAL status after deadline passes", () => {
      const status = deriveContributionStatus(obligationAmount, partialPaid, dueDate, afterDeadline);
      expect(status).toBe("OVERDUE_PARTIAL");
    });

    it("calculates accurate remaining balance in integer pesewas", () => {
      const remaining = subtractPesewas(obligationAmount, partialPaid);
      expect(remaining).toBe(15000); // GH₵150 remaining
    });
  });

  describe("Scenario 3: Full Payment", () => {
    it("derives PAID status before deadline", () => {
      const status = deriveContributionStatus(obligationAmount, 25000, dueDate, beforeDeadline);
      expect(status).toBe("PAID");
    });

    it("remains PAID after deadline passes", () => {
      const status = deriveContributionStatus(obligationAmount, 25000, dueDate, afterDeadline);
      expect(status).toBe("PAID");
    });

    it("leaves zero outstanding balance", () => {
      const remaining = subtractPesewas(obligationAmount, 25000);
      expect(remaining).toBe(0);
    });
  });

  describe("Scenario 4: Multiple Partial Payments", () => {
    it("accumulates multiple partial allocations into full payment (PARTIAL -> PAID)", () => {
      const firstPayment = 10000; // GH₵100
      const secondPayment = 15000; // GH₵150

      // Step 1: After first payment
      const totalPaid1 = addPesewas(0, firstPayment);
      expect(totalPaid1).toBe(10000);
      expect(deriveContributionStatus(obligationAmount, totalPaid1, dueDate, beforeDeadline)).toBe("PARTIAL");

      // Step 2: After second payment
      const totalPaid2 = addPesewas(totalPaid1, secondPayment);
      expect(totalPaid2).toBe(25000);
      expect(deriveContributionStatus(obligationAmount, totalPaid2, dueDate, beforeDeadline)).toBe("PAID");
      expect(subtractPesewas(obligationAmount, totalPaid2)).toBe(0);
    });
  });

  describe("Scenario 5: Late Payment (Paid After Deadline)", () => {
    it("transitions from OVERDUE to PAID when payment arrives after deadline", () => {
      // 1. Before payment arrives post-deadline
      const statusBeforePay = deriveContributionStatus(obligationAmount, 0, dueDate, afterDeadline);
      expect(statusBeforePay).toBe("OVERDUE");

      // 2. Member pays 25,000 pesewas after deadline
      const statusAfterPay = deriveContributionStatus(obligationAmount, 25000, dueDate, afterDeadline);
      expect(statusAfterPay).toBe("PAID");
      expect(subtractPesewas(obligationAmount, 25000)).toBe(0);
    });
  });

  describe("Scenario 6: Reversed Payment Allocation", () => {
    it("reverts status to PENDING or OVERDUE when payment is reversed", () => {
      // Obligation was paid (25,000 pesewas)
      let currentPaid = 25000;
      expect(deriveContributionStatus(obligationAmount, currentPaid, dueDate, beforeDeadline)).toBe("PAID");

      // Payment reversed by administrator: 25,000 deducted
      currentPaid = subtractPesewas(currentPaid, 25000);
      expect(currentPaid).toBe(0);

      // Reverts to PENDING before deadline
      expect(deriveContributionStatus(obligationAmount, currentPaid, dueDate, beforeDeadline)).toBe("PENDING");

      // Reverts to OVERDUE if evaluated after deadline
      expect(deriveContributionStatus(obligationAmount, currentPaid, dueDate, afterDeadline)).toBe("OVERDUE");
    });
  });

  describe("Scenario 7: Overpayment Protection", () => {
    it("caps allocation at obligation maximum (25,000 pesewas)", () => {
      const payerAttemptAmount = 30000; // GH₵300 (overpayment by GH₵50)
      const maxAllocatable = Math.min(obligationAmount, payerAttemptAmount);
      const surplus = subtractPesewas(payerAttemptAmount, maxAllocatable);

      expect(maxAllocatable).toBe(25000);
      expect(surplus).toBe(5000); // 5,000 pesewas unallocated surplus
      expect(deriveContributionStatus(obligationAmount, maxAllocatable, dueDate, beforeDeadline)).toBe("PAID");
    });
  });

  describe("Integer Pesewas Boundary Validation", () => {
    it("rejects negative or non-integer amounts in deriveContributionStatus", () => {
      expect(() => deriveContributionStatus(-100, 0, dueDate)).toThrow(RangeError);
      expect(() => deriveContributionStatus(25000, -500, dueDate)).toThrow(RangeError);
      expect(() => deriveContributionStatus(250.5, 0, dueDate)).toThrow(RangeError);
    });
  });
});

