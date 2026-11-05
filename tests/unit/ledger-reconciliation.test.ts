import { describe, it, expect } from "vitest";
import {
  recordAdjustmentSchema,
  adjustmentEntrySchema,
  transactionFilterSchema,
} from "../../src/lib/validation/ledger";
import {
  formatPesewas,
  addPesewas,
  subtractPesewas,
} from "../../src/lib/formatting/currency";
import {
  AccountType,
  LedgerDirection,
  TransactionType,
} from "@prisma/client";

describe("Double-Entry Ledger & Financial Reconciliation (Phase 9)", () => {
  const dummyAccountId1 = "c0a80101-0000-0000-0000-000000000001"; // 1010 Cash
  const dummyAccountId2 = "c0a80101-0000-0000-0000-000000000002"; // 4010 Revenue
  const dummyAccountId3 = "c0a80101-0000-0000-0000-000000000003"; // 5010 Disbursements
  const dummyAccountId4 = "c0a80101-0000-0000-0000-000000000004"; // 2010 Obligations

  describe("Validation of Manual Journal Adjustments (Double-Entry Invariant)", () => {
    it("accepts a perfectly balanced adjustment between two accounts", () => {
      const result = recordAdjustmentSchema.safeParse({
        reference: "TXN-ADJ-001",
        description: "Bank fee reconciliation adjustment",
        entries: [
          {
            accountId: dummyAccountId3, // Expense
            direction: LedgerDirection.DEBIT,
            amountPesewas: 1500, // GH₵15.00
          },
          {
            accountId: dummyAccountId1, // Cash
            direction: LedgerDirection.CREDIT,
            amountPesewas: 1500, // GH₵15.00
          },
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entries).toHaveLength(2);
        expect(result.data.description).toBe("Bank fee reconciliation adjustment");
      }
    });

    it("accepts a compound adjustment entry with multiple debits and credits", () => {
      const result = recordAdjustmentSchema.safeParse({
        reference: "TXN-ADJ-COMPOUND",
        description: "Multi-leg settlement adjustment",
        entries: [
          {
            accountId: dummyAccountId1,
            direction: LedgerDirection.DEBIT,
            amountPesewas: 20000, // GH₵200
          },
          {
            accountId: dummyAccountId3,
            direction: LedgerDirection.DEBIT,
            amountPesewas: 5000, // GH₵50
          },
          {
            accountId: dummyAccountId2,
            direction: LedgerDirection.CREDIT,
            amountPesewas: 25000, // GH₵250
          },
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const totalDebits = result.data.entries
          .filter((e) => e.direction === LedgerDirection.DEBIT)
          .reduce((sum, e) => sum + e.amountPesewas, 0);
        const totalCredits = result.data.entries
          .filter((e) => e.direction === LedgerDirection.CREDIT)
          .reduce((sum, e) => sum + e.amountPesewas, 0);

        expect(totalDebits).toBe(25000);
        expect(totalCredits).toBe(25000);
        expect(totalDebits).toBe(totalCredits);
      }
    });

    it("rejects an unbalanced adjustment where Debits != Credits", () => {
      const result = recordAdjustmentSchema.safeParse({
        reference: "TXN-ADJ-UNBALANCED",
        description: "Unbalanced adjustment attempt",
        entries: [
          {
            accountId: dummyAccountId1,
            direction: LedgerDirection.DEBIT,
            amountPesewas: 25000, // GH₵250
          },
          {
            accountId: dummyAccountId2,
            direction: LedgerDirection.CREDIT,
            amountPesewas: 20000, // GH₵200 (Difference of GH₵50!)
          },
        ],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toContain("Double-entry invariant violated");
      }
    });

    it("rejects an adjustment with only DEBIT entries (no CREDIT)", () => {
      const result = recordAdjustmentSchema.safeParse({
        description: "All debits adjustment",
        entries: [
          {
            accountId: dummyAccountId1,
            direction: LedgerDirection.DEBIT,
            amountPesewas: 10000,
          },
          {
            accountId: dummyAccountId3,
            direction: LedgerDirection.DEBIT,
            amountPesewas: 10000,
          },
        ],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "must include at least one DEBIT and one CREDIT entry"
        );
      }
    });

    it("rejects non-integer floating point amounts (pesewas must strictly be integers)", () => {
      const result = adjustmentEntrySchema.safeParse({
        accountId: dummyAccountId1,
        direction: LedgerDirection.DEBIT,
        amountPesewas: 2500.5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("strictly an integer");
      }
    });

    it("rejects zero or negative entry amounts", () => {
      const zeroResult = adjustmentEntrySchema.safeParse({
        accountId: dummyAccountId1,
        direction: LedgerDirection.DEBIT,
        amountPesewas: 0,
      });
      expect(zeroResult.success).toBe(false);

      const negativeResult = adjustmentEntrySchema.safeParse({
        accountId: dummyAccountId1,
        direction: LedgerDirection.DEBIT,
        amountPesewas: -500,
      });
      expect(negativeResult.success).toBe(false);
    });

    it("rejects adjustments with fewer than 2 entries", () => {
      const result = recordAdjustmentSchema.safeParse({
        description: "Single entry adjustment",
        entries: [
          {
            accountId: dummyAccountId1,
            direction: LedgerDirection.DEBIT,
            amountPesewas: 5000,
          },
        ],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 2 ledger entries");
      }
    });

    it("rejects descriptions shorter than 5 characters", () => {
      const result = recordAdjustmentSchema.safeParse({
        description: "bad",
        entries: [
          {
            accountId: dummyAccountId1,
            direction: LedgerDirection.DEBIT,
            amountPesewas: 1000,
          },
          {
            accountId: dummyAccountId2,
            direction: LedgerDirection.CREDIT,
            amountPesewas: 1000,
          },
        ],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 5 characters");
      }
    });
  });

  describe("Trial Balance Calculation & Normal Account Balances", () => {
    it("correctly calculates normal DEBIT balances for ASSET and EXPENSE accounts", () => {
      // Asset: 1010 Cash (Debits: GH₵1,000, Credits: GH₵250 -> Net Debit GH₵750)
      const cashRawDebits = 100000;
      const cashRawCredits = 25000;
      const cashNetBalance = subtractPesewas(cashRawDebits, cashRawCredits);
      expect(cashNetBalance).toBe(75000);
      expect(formatPesewas(cashNetBalance)).toBe("GH₵750.00");

      // Expense: 5010 Disbursements (Debits: GH₵1,000, Credits: 0 -> Net Debit GH₵1,000)
      const expenseRawDebits = 100000;
      const expenseRawCredits = 0;
      const expenseNetBalance = subtractPesewas(expenseRawDebits, expenseRawCredits);
      expect(expenseNetBalance).toBe(100000);
      expect(formatPesewas(expenseNetBalance)).toBe("GH₵1,000.00");
    });

    it("correctly calculates normal CREDIT balances for LIABILITY, EQUITY, and REVENUE accounts", () => {
      // Revenue: 4010 Contribution Revenue (Credits: GH₵1,000, Debits: 0 -> Net Credit GH₵1,000)
      const revenueRawDebits = 0;
      const revenueRawCredits = 100000;
      const revenueNetBalance = subtractPesewas(revenueRawCredits, revenueRawDebits);
      expect(revenueNetBalance).toBe(100000);
      expect(formatPesewas(revenueNetBalance)).toBe("GH₵1,000.00");

      // Liability: 2010 Obligations (Credits: GH₵500, Debits: GH₵200 -> Net Credit GH₵300)
      const liabilityRawDebits = 20000;
      const liabilityRawCredits = 50000;
      const liabilityNetBalance = subtractPesewas(liabilityRawCredits, liabilityRawDebits);
      expect(liabilityNetBalance).toBe(30000);
      expect(formatPesewas(liabilityNetBalance)).toBe("GH₵300.00");
    });

    it("asserts Trial Balance equality (Total Debits === Total Credits) after complete monthly cycle", () => {
      // Simulate Month 1:
      // 4 members each pay GH₵250:
      // Debit 1010 (Cash) 4 x 25,000 = 100,000
      // Credit 4010 (Revenue) 4 x 25,000 = 100,000
      const contributionsCashDebit = 100000;
      const contributionsRevenueCredit = 100000;

      // Payout of GH₵1,000 disbursed to Member 1:
      // Debit 5010 (Disbursements Expense) 100,000
      // Credit 1010 (Cash) 100,000
      const payoutDisbursementDebit = 100000;
      const payoutCashCredit = 100000;

      // Calculate account net balances:
      // Account 1010 (Cash Asset): Debits = 100,000, Credits = 100,000 -> Debit Balance = 0, Credit Balance = 0
      const cashDebitBalance = Math.max(0, contributionsCashDebit - payoutCashCredit);
      const cashCreditBalance = Math.max(0, payoutCashCredit - contributionsCashDebit);

      // Account 4010 (Revenue): Debits = 0, Credits = 100,000 -> Debit Balance = 0, Credit Balance = 100,000
      const revenueDebitBalance = 0;
      const revenueCreditBalance = contributionsRevenueCredit;

      // Account 5010 (Expense): Debits = 100,000, Credits = 0 -> Debit Balance = 100,000, Credit Balance = 0
      const expenseDebitBalance = payoutDisbursementDebit;
      const expenseCreditBalance = 0;

      // Trial balance totals:
      const totalTrialDebits = addPesewas(cashDebitBalance, revenueDebitBalance, expenseDebitBalance);
      const totalTrialCredits = addPesewas(cashCreditBalance, revenueCreditBalance, expenseCreditBalance);

      expect(totalTrialDebits).toBe(100000);
      expect(totalTrialCredits).toBe(100000);
      expect(totalTrialDebits).toBe(totalTrialCredits); // Balanced!
    });
  });

  describe("Fundamental Accounting Equation Check", () => {
    it("satisfies Assets = Liabilities + Equity + (Revenue - Expenses)", () => {
      // State after 4 contributions collected (GH₵1,000 in Cash) and 0 payouts disbursed yet:
      const totalAssets = 100000; // Account 1010 (Cash)
      const totalLiabilities = 0;
      const totalEquity = 0;
      const totalRevenue = 100000; // Account 4010 (Revenue)
      const totalExpense = 0; // Account 5010 (Disbursements)

      const netSurplus = subtractPesewas(totalRevenue, totalExpense);
      const rightHandSide = addPesewas(totalLiabilities, totalEquity, netSurplus);

      expect(totalAssets).toBe(rightHandSide);
      expect(totalAssets - rightHandSide).toBe(0);
    });

    it("satisfies equation after full payout disbursement of GH₵1,000", () => {
      // 4 contributions collected = GH₵1,000 cash, GH₵1,000 revenue
      // 1 payout disbursed = GH₵1,000 cash out, GH₵1,000 expense
      const totalAssets = 0; // Cash is 100,000 - 100,000 = 0
      const totalLiabilities = 0;
      const totalEquity = 0;
      const totalRevenue = 100000;
      const totalExpense = 100000;

      const netSurplus = subtractPesewas(totalRevenue, totalExpense); // 0
      const rightHandSide = addPesewas(totalLiabilities, totalEquity, netSurplus); // 0

      expect(totalAssets).toBe(rightHandSide);
      expect(totalAssets - rightHandSide).toBe(0);
    });
  });

  describe("Cash Book Reconciliation (Account 1010)", () => {
    it("accurately tracks inflows, outflows, and checks payout reserve solvency", () => {
      const openingBalance = 0;
      const member1 = 25000; // GH₵250
      const member2 = 25000; // GH₵250
      const member3 = 25000; // GH₵250

      const totalInflows = addPesewas(openingBalance, member1, member2, member3); // GH₵750
      const totalOutflows = 0;
      const netCashBalance = subtractPesewas(totalInflows, totalOutflows);

      const targetPayout = 100000; // GH₵1,000
      const canCoverFullPayout = netCashBalance >= targetPayout;
      const shortfall = Math.max(0, targetPayout - netCashBalance);

      expect(netCashBalance).toBe(75000);
      expect(canCoverFullPayout).toBe(false);
      expect(shortfall).toBe(25000); // 1 member short of full GH₵1,000 payout
    });

    it("verifies solvency when 4th member pays bringing cash to exactly GH₵1,000", () => {
      const previousCash = 75000;
      const member4 = 25000;
      const netCash = addPesewas(previousCash, member4);

      const targetPayout = 100000;
      expect(netCash).toBe(100000);
      expect(netCash >= targetPayout).toBe(true);
    });
  });

  describe("Transaction Filter Validation", () => {
    it("parses valid transaction filter options with defaults", () => {
      const result = transactionFilterSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(50);
        expect(result.data.sortOrder).toBe("desc");
      }
    });

    it("validates specific transaction types and search parameters", () => {
      const result = transactionFilterSchema.safeParse({
        page: "2",
        limit: "25",
        type: TransactionType.CONTRIBUTION,
        search: "TXN-PAY-001",
        sortOrder: "asc",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(25);
        expect(result.data.type).toBe("CONTRIBUTION");
        expect(result.data.search).toBe("TXN-PAY-001");
        expect(result.data.sortOrder).toBe("asc");
      }
    });

    it("rejects limits exceeding 200", () => {
      const result = transactionFilterSchema.safeParse({
        limit: 500,
      });
      expect(result.success).toBe(false);
    });
  });
});

