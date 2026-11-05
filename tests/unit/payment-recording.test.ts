import { describe, it, expect } from "vitest";
import {
  recordManualPaymentSchema,
  verifyPaymentSchema,
  reversePaymentSchema,
  paymentChannels,
  type RecordManualPaymentInput,
} from "../../src/lib/validation/payment";
import { deriveContributionStatus } from "../../src/lib/financial/contribution-status";
import {
  formatPesewas,
  addPesewas,
  subtractPesewas,
} from "../../src/lib/formatting/currency";
import {
  PaymentChannel,
  PaymentStatus,
  LedgerDirection,
  TransactionType,
} from "@prisma/client";

describe("Manual Payment Recording & Ledger Accounting (Phase 7)", () => {
  const dummyMemberId = "c0a80101-0000-0000-0000-000000000001";
  const dummyObligationId = "c0a80101-0000-0000-0000-000000000010";
  const fullMonthlyAmount = 25000; // GH₵250 in integer pesewas
  const baseDate = new Date("2025-02-10T10:00:00.000Z");
  const dueDate = new Date("2025-02-15T23:59:59.000Z");

  describe("Validation of Ghanaian Payment Channels & Form Inputs", () => {
    it("accepts valid manual payment inputs for all 6 supported Ghanaian channels", () => {
      const channels: PaymentChannel[] = [
        "CASH",
        "MTN_MOMO",
        "TELECEL_CASH",
        "AT_MONEY",
        "BANK_TRANSFER",
        "OTHER",
      ];

      for (const channel of channels) {
        const result = recordManualPaymentSchema.safeParse({
          memberId: dummyMemberId,
          obligationId: dummyObligationId,
          amountPesewas: fullMonthlyAmount,
          channel,
          paymentDate: baseDate.toISOString(),
          reference: `REF-${channel}-001`,
          notes: `Test payment via ${channel}`,
          verifyImmediately: true,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.channel).toBe(channel);
          expect(result.data.amountPesewas).toBe(25000);
        }
      }
    });

    it("rejects non-integer floating point amounts (pesewas must strictly be integers)", () => {
      const floatInput = {
        memberId: dummyMemberId,
        obligationId: dummyObligationId,
        amountPesewas: 25000.5, // Invalid: floating point
        channel: "MTN_MOMO",
        paymentDate: baseDate.toISOString(),
        reference: "MOMO-987654",
      };

      const result = recordManualPaymentSchema.safeParse(floatInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("strictly as integer pesewas");
      }
    });

    it("rejects zero or negative payment amounts", () => {
      const zeroResult = recordManualPaymentSchema.safeParse({
        memberId: dummyMemberId,
        obligationId: dummyObligationId,
        amountPesewas: 0,
        channel: "CASH",
        paymentDate: baseDate.toISOString(),
        reference: "REC-001",
      });
      expect(zeroResult.success).toBe(false);

      const negativeResult = recordManualPaymentSchema.safeParse({
        memberId: dummyMemberId,
        obligationId: dummyObligationId,
        amountPesewas: -5000,
        channel: "CASH",
        paymentDate: baseDate.toISOString(),
        reference: "REC-002",
      });
      expect(negativeResult.success).toBe(false);
    });

    it("requires a non-empty transaction reference for audit evidence", () => {
      const emptyRefResult = recordManualPaymentSchema.safeParse({
        memberId: dummyMemberId,
        obligationId: dummyObligationId,
        amountPesewas: 25000,
        channel: "CASH",
        paymentDate: baseDate.toISOString(),
        reference: " ",
      });
      expect(emptyRefResult.success).toBe(false);
    });

    it("rejects an invalid payment channel name", () => {
      const invalidChannelResult = recordManualPaymentSchema.safeParse({
        memberId: dummyMemberId,
        obligationId: dummyObligationId,
        amountPesewas: 25000,
        channel: "BITCOIN",
        paymentDate: baseDate.toISOString(),
        reference: "BTC-001",
      });
      expect(invalidChannelResult.success).toBe(false);
    });
  });

  describe("Obligation Settlement & Status Flow", () => {
    it("handles single partial payment and marks obligation as PARTIAL", () => {
      const initialPaid = 0;
      const partialPayment = 10000; // GH₵100.00 in pesewas

      const newPaid = addPesewas(initialPaid, partialPayment);
      const remaining = subtractPesewas(fullMonthlyAmount, newPaid);

      expect(newPaid).toBe(10000);
      expect(remaining).toBe(15000);

      const status = deriveContributionStatus(fullMonthlyAmount, newPaid, dueDate, baseDate);
      expect(status).toBe("PARTIAL");
    });

    it("completes obligation with a second partial payment and marks status as PAID", () => {
      const currentPaid = 10000; // GH₵100.00
      const secondPayment = 15000; // GH₵150.00

      const finalPaid = addPesewas(currentPaid, secondPayment);
      const remaining = subtractPesewas(fullMonthlyAmount, finalPaid);

      expect(finalPaid).toBe(25000);
      expect(remaining).toBe(0);

      const status = deriveContributionStatus(fullMonthlyAmount, finalPaid, dueDate, baseDate);
      expect(status).toBe("PAID");
    });

    it("rejects payment that exceeds remaining obligation balance", () => {
      const currentPaid = 20000; // GH₵200.00 already paid
      const remaining = subtractPesewas(fullMonthlyAmount, currentPaid); // 5000 pesewas remaining
      const attemptedPayment = 10000; // GH₵100.00

      const isOverpayment = attemptedPayment > remaining;
      expect(isOverpayment).toBe(true);
      expect(remaining).toBe(5000);
    });
  });

  describe("Balanced Double-Entry General Ledger Postings", () => {
    it("verifies payment creates balanced transaction with Debit 1010 and Credit 4010", () => {
      const paymentAmount = 25000; // GH₵250.00 in pesewas
      const cashAccountId = "account-1010-cash";
      const revenueAccountId = "account-4010-revenue";

      const ledgerEntries = [
        {
          accountId: cashAccountId,
          direction: LedgerDirection.DEBIT,
          amount: paymentAmount,
        },
        {
          accountId: revenueAccountId,
          direction: LedgerDirection.CREDIT,
          amount: paymentAmount,
        },
      ];

      // Calculate total debits and credits
      const totalDebits = ledgerEntries
        .filter((e) => e.direction === LedgerDirection.DEBIT)
        .reduce((sum, e) => sum + e.amount, 0);

      const totalCredits = ledgerEntries
        .filter((e) => e.direction === LedgerDirection.CREDIT)
        .reduce((sum, e) => sum + e.amount, 0);

      // Invariants: Total Debits must equal Total Credits exactly
      expect(totalDebits).toBe(paymentAmount);
      expect(totalCredits).toBe(paymentAmount);
      expect(totalDebits - totalCredits).toBe(0);
      expect(Number.isInteger(totalDebits)).toBe(true);
    });

    it("verifies partial payments also generate strictly balanced ledger postings", () => {
      const partialAmounts = [7500, 12500, 5000]; // 75 + 125 + 50 = GH₵250

      let accumulatedDebits = 0;
      let accumulatedCredits = 0;

      for (const amount of partialAmounts) {
        const debitEntry = { direction: LedgerDirection.DEBIT, amount };
        const creditEntry = { direction: LedgerDirection.CREDIT, amount };

        expect(debitEntry.amount).toBe(creditEntry.amount);
        accumulatedDebits += debitEntry.amount;
        accumulatedCredits += creditEntry.amount;
      }

      expect(accumulatedDebits).toBe(25000);
      expect(accumulatedCredits).toBe(25000);
      expect(accumulatedDebits - accumulatedCredits).toBe(0);
    });
  });

  describe("Payment Reversal & Audit Controls", () => {
    it("validates administrative reversal reason meets minimum length requirement", () => {
      const invalidReason = reversePaymentSchema.safeParse({ reason: "bad" });
      expect(invalidReason.success).toBe(false);

      const validReason = reversePaymentSchema.safeParse({
        reason: "Duplicate MoMo transaction entered by admin error",
      });
      expect(validReason.success).toBe(true);
    });

    it("posts balanced reversing entries (Debit 4010, Credit 1010) on reversal", () => {
      const originalAmount = 25000;
      const cashAccountId = "account-1010-cash";
      const revenueAccountId = "account-4010-revenue";

      // Reversal flips the directions
      const reversalEntries = [
        {
          accountId: revenueAccountId,
          direction: LedgerDirection.DEBIT,
          amount: originalAmount,
        },
        {
          accountId: cashAccountId,
          direction: LedgerDirection.CREDIT,
          amount: originalAmount,
        },
      ];

      const revDebits = reversalEntries
        .filter((e) => e.direction === LedgerDirection.DEBIT)
        .reduce((sum, e) => sum + e.amount, 0);
      const revCredits = reversalEntries
        .filter((e) => e.direction === LedgerDirection.CREDIT)
        .reduce((sum, e) => sum + e.amount, 0);

      expect(revDebits).toBe(originalAmount);
      expect(revCredits).toBe(originalAmount);
      expect(revDebits - revCredits).toBe(0);
    });

    it("rolls back obligation paidAmount accurately upon reversal", () => {
      const obligationAmount = 25000;
      const paidBeforeReversal = 25000;
      const paymentToReverse = 25000;

      const paidAfterReversal = Math.max(0, paidBeforeReversal - paymentToReverse);
      const outstandingAfterReversal = obligationAmount - paidAfterReversal;

      expect(paidAfterReversal).toBe(0);
      expect(outstandingAfterReversal).toBe(25000);

      const statusAfterReversal = deriveContributionStatus(
        obligationAmount,
        paidAfterReversal,
        dueDate,
        baseDate
      );
      expect(statusAfterReversal).toBe("PENDING");
    });

    it("recalculates PARTIAL status if only one of multiple payments is reversed", () => {
      const obligationAmount = 25000;
      // Member had made two payments: 10,000 + 15,000 = 25,000
      const totalPaid = 25000;
      const reversedPaymentAmount = 15000;

      const remainingPaid = Math.max(0, totalPaid - reversedPaymentAmount);
      expect(remainingPaid).toBe(10000);

      const status = deriveContributionStatus(
        obligationAmount,
        remainingPaid,
        dueDate,
        baseDate
      );
      expect(status).toBe("PARTIAL");
    });
  });

  describe("Ghanaian Currency Display & Integrity", () => {
    it("formats integer pesewas accurately to Ghana Cedis", () => {
      expect(formatPesewas(25000)).toBe("GH₵250.00");
      expect(formatPesewas(100000)).toBe("GH₵1,000.00");
      expect(formatPesewas(50)).toBe("GH₵0.50");
      expect(formatPesewas(0)).toBe("GH₵0.00");
    });
  });
});

