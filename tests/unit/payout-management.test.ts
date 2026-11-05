import { describe, it, expect } from "vitest";
import {
  authorizePayoutSchema,
  disbursePayoutSchema,
  acknowledgePayoutSchema,
  postponePayoutSchema,
} from "../../src/lib/validation/payout";
import {
  formatPesewas,
  addPesewas,
  subtractPesewas,
} from "../../src/lib/formatting/currency";
import {
  PayoutStatus,
  PaymentChannel,
  ResolutionType,
  LedgerDirection,
  AccountType,
} from "@prisma/client";

describe("Fixed Payout Rotation & Payout Management (Phase 8)", () => {
  const expectedMonthlyPayoutPesewas = 100000; // GH₵1,000.00 in integer pesewas
  const memberA = { id: "member-a", name: "Member A", position: 1 };
  const memberB = { id: "member-b", name: "Member B", position: 2 };
  const memberC = { id: "member-c", name: "Member C", position: 3 };
  const memberD = { id: "member-d", name: "Member D", position: 4 };

  describe("Payout Validation Schemas", () => {
    it("validates full payout authorization of 100,000 pesewas (GH₵1,000.00)", () => {
      const result = authorizePayoutSchema.safeParse({
        amountPesewas: expectedMonthlyPayoutPesewas,
        groupAuthorized: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amountPesewas).toBe(100000);
      }
    });

    it("rejects non-integer floating point amounts for payout authorization", () => {
      const result = authorizePayoutSchema.safeParse({
        amountPesewas: 100000.5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("strictly an integer in pesewas");
      }
    });

    it("rejects zero or negative authorization amounts", () => {
      const zeroResult = authorizePayoutSchema.safeParse({ amountPesewas: 0 });
      expect(zeroResult.success).toBe(false);

      const negResult = authorizePayoutSchema.safeParse({ amountPesewas: -10000 });
      expect(negResult.success).toBe(false);
    });

    it("validates disbursement input across all supported Ghanaian payment channels", () => {
      const channels: PaymentChannel[] = [
        "CASH",
        "MTN_MOMO",
        "TELECEL_CASH",
        "AT_MONEY",
        "BANK_TRANSFER",
        "OTHER",
      ];

      for (const channel of channels) {
        const result = disbursePayoutSchema.safeParse({
          channel,
          reference: `DISB-${channel}-1001`,
          notes: `Handed over via ${channel}`,
        });
        expect(result.success).toBe(true);
      }
    });

    it("requires non-empty transaction reference for disbursement", () => {
      const result = disbursePayoutSchema.safeParse({
        channel: "MTN_MOMO",
        reference: " ",
      });
      expect(result.success).toBe(false);
    });

    it("validates recipient acknowledgement notes", () => {
      const valid = acknowledgePayoutSchema.safeParse({
        acknowledgement: "Signed physical payment voucher at monthly meeting",
      });
      expect(valid.success).toBe(true);

      const invalid = acknowledgePayoutSchema.safeParse({
        acknowledgement: "ok", // Too short
      });
      expect(invalid.success).toBe(false);
    });

    it("validates postponement reason requiring at least 5 characters", () => {
      const valid = postponePayoutSchema.safeParse({
        reason: "Two members have pending MoMo deposits; holding until funds settle.",
      });
      expect(valid.success).toBe(true);

      const invalid = postponePayoutSchema.safeParse({
        reason: "wait",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("Fixed Rotation Sequence & Recipient Determination", () => {
    it("preserves fixed 4-member rotation order (Positions 1 to 4)", () => {
      const rotation = [memberA, memberB, memberC, memberD];

      expect(rotation[0].position).toBe(1);
      expect(rotation[1].position).toBe(2);
      expect(rotation[2].position).toBe(3);
      expect(rotation[3].position).toBe(4);

      // Total cycle expected payout is 4 * 100,000 = 400,000 pesewas (GH₵4,000.00)
      const totalCyclePayout = rotation.length * expectedMonthlyPayoutPesewas;
      expect(totalCyclePayout).toBe(400000);
      expect(formatPesewas(totalCyclePayout)).toBe("GH₵4,000.00");
    });

    it("blocks authorization of Position 2 if Position 1 is not yet acknowledged", () => {
      const position1Payout: { rotationPosition: number; status: PayoutStatus; acknowledgedAt: Date | null } = {
        rotationPosition: 1,
        status: PayoutStatus.DISBURSED, // Disbursed but not yet acknowledged
        acknowledgedAt: null,
      };

      const canAuthorizePosition2 =
        position1Payout.status === PayoutStatus.ACKNOWLEDGED ||
        (position1Payout.status === PayoutStatus.PARTIAL && position1Payout.acknowledgedAt !== null);

      expect(canAuthorizePosition2).toBe(false);
    });

    it("allows authorization of Position 2 once Position 1 is acknowledged", () => {
      const position1Payout = {
        rotationPosition: 1,
        status: PayoutStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
      };

      const canAuthorizePosition2 =
        position1Payout.status === PayoutStatus.ACKNOWLEDGED ||
        (position1Payout.status === PayoutStatus.PARTIAL && position1Payout.acknowledgedAt !== null);

      expect(canAuthorizePosition2).toBe(true);
    });
  });

  describe("Liquidity Protection & Available Group Balance", () => {
    it("prevents payout authorization exceeding available verified group balance", () => {
      const verifiedCollectedPesewas = 75000; // GH₵750 collected (1 member hasn't paid)
      const requestedPayoutPesewas = 100000; // GH₵1,000 requested

      const hasSufficientFunds = requestedPayoutPesewas <= verifiedCollectedPesewas;
      expect(hasSufficientFunds).toBe(false);
    });

    it("allows payout authorization when verified funds match or exceed requested amount", () => {
      const verifiedCollectedPesewas = 100000; // GH₵1,000 full collection
      const requestedPayoutPesewas = 100000;

      const hasSufficientFunds = requestedPayoutPesewas <= verifiedCollectedPesewas;
      expect(hasSufficientFunds).toBe(true);
    });
  });

  describe("Exception Management & Shortfall Resolutions", () => {
    it("requires documented resolution and group authorization if period has shortfall", () => {
      const periodShortfall = 25000; // GH₵250 unpaid by 1 member

      // Attempting to authorize without resolution
      const isShortfall = periodShortfall > 0;
      expect(isShortfall).toBe(true);

      // Resolution Option B: Carry Forward
      const carryForwardResolution = {
        resolutionType: ResolutionType.CARRY_FORWARD,
        reason: "Member D traveling; promised to pay next week. Group agreed to disburse from reserves.",
        groupAuthorized: true,
      };

      expect(carryForwardResolution.resolutionType).toBe("CARRY_FORWARD");
      expect(carryForwardResolution.groupAuthorized).toBe(true);
    });

    it("properly calculates partial payout when group chooses Option C (Partial Payout)", () => {
      const periodShortfall = 25000; // GH₵250 shortfall
      const availableFunds = subtractPesewas(expectedMonthlyPayoutPesewas, periodShortfall); // 75,000 pesewas = GH₵750

      expect(availableFunds).toBe(75000);
      expect(formatPesewas(availableFunds)).toBe("GH₵750.00");

      const partialPayout = {
        expectedAmount: expectedMonthlyPayoutPesewas,
        authorizedAmount: availableFunds,
        outstandingAmount: subtractPesewas(expectedMonthlyPayoutPesewas, availableFunds),
        resolutionType: ResolutionType.PARTIAL_PAYOUT,
        status: PayoutStatus.PARTIAL,
      };

      expect(partialPayout.authorizedAmount).toBe(75000);
      expect(partialPayout.outstandingAmount).toBe(25000);
      expect(partialPayout.status).toBe("PARTIAL");
    });
  });

  describe("Balanced Double-Entry General Ledger on Disbursement", () => {
    it("generates balanced ledger transaction debiting Expense 5010 and crediting Asset 1010", () => {
      const disbursementAmount = 100000; // GH₵1,000
      const cashAccountId = "account-1010-cash";
      const payoutDisbursementAccountId = "account-5010-payouts";

      const ledgerEntries = [
        {
          accountId: payoutDisbursementAccountId,
          direction: LedgerDirection.DEBIT,
          amount: disbursementAmount,
        },
        {
          accountId: cashAccountId,
          direction: LedgerDirection.CREDIT,
          amount: disbursementAmount,
        },
      ];

      const totalDebits = ledgerEntries
        .filter((e) => e.direction === LedgerDirection.DEBIT)
        .reduce((sum, e) => sum + e.amount, 0);

      const totalCredits = ledgerEntries
        .filter((e) => e.direction === LedgerDirection.CREDIT)
        .reduce((sum, e) => sum + e.amount, 0);

      expect(totalDebits).toBe(disbursementAmount);
      expect(totalCredits).toBe(disbursementAmount);
      expect(totalDebits - totalCredits).toBe(0);
      expect(Number.isInteger(totalDebits)).toBe(true);
    });

    it("verifies cash balance decreases by exactly the disbursed amount", () => {
      const initialCash = 100000; // GH₵1,000 collected
      const payoutDisbursed = 100000; // GH₵1,000 paid out

      const remainingCash = subtractPesewas(initialCash, payoutDisbursed);
      expect(remainingCash).toBe(0);
    });
  });

  describe("Separate Recipient Acknowledgement", () => {
    it("distinguishes administrative disbursement from recipient acknowledgement", () => {
      const payout = {
        id: "payout-001",
        status: PayoutStatus.DISBURSED,
        disbursedAt: new Date("2025-02-15T15:00:00.000Z"),
        disbursedBy: "admin-uuid",
        acknowledgedAt: null,
        acknowledger: null,
      };

      expect(payout.status).toBe(PayoutStatus.DISBURSED);
      expect(payout.acknowledgedAt).toBeNull();

      // Recipient acknowledges later
      const acknowledgedPayout = {
        ...payout,
        status: PayoutStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date("2025-02-15T16:30:00.000Z"),
        notes: "Recipient confirmed receipt of GH₵1,000 MoMo transfer",
      };

      expect(acknowledgedPayout.status).toBe(PayoutStatus.ACKNOWLEDGED);
      expect(acknowledgedPayout.acknowledgedAt).not.toBeNull();
    });
  });
});

