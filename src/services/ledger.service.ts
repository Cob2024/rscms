import { prisma } from "@/lib/database/prisma";
import {
  AccountType,
  LedgerDirection,
  TransactionType,
  Prisma,
} from "@prisma/client";
import {
  RecordAdjustmentInput,
  recordAdjustmentSchema,
  TransactionFilterInput,
} from "@/lib/validation/ledger";
import { addPesewas, subtractPesewas } from "@/lib/formatting/currency";

export interface AccountBalanceSummary {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  description: string | null;
  rawDebits: number;
  rawCredits: number;
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
  entryCount: number;
}

export interface TrialBalanceResult {
  asOf: string;
  group: { id: string; name: string };
  isBalanced: boolean;
  totalDebits: number;
  totalCredits: number;
  differencePesewas: number;
  accounts: AccountBalanceSummary[];
}

export interface CashReconciliationResult {
  asOf: string;
  group: { id: string; name: string };
  cashAccountId: string;
  cashAccountCode: string;
  cashAccountName: string;
  openingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  netCashBalance: number;
  isSolvent: boolean;
  canCoverFullPayout: boolean;
  standardMonthlyPayoutTarget: number;
  inflowBreakdown: {
    contributions: number;
    adjustments: number;
    reversals: number;
    other: number;
  };
  outflowBreakdown: {
    payoutDisbursements: number;
    paymentReversals: number;
    adjustments: number;
    other: number;
  };
  recentMovements: Array<{
    id: string;
    transactionId: string;
    reference: string;
    transactionType: TransactionType;
    description: string;
    direction: LedgerDirection;
    amount: number;
    createdAt: string;
  }>;
}

export interface AccountCategorySummary {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpense: number;
  netSurplus: number;
  isAccountingEquationBalanced: boolean;
  equationDiscrepancy: number;
  accountsByType: Record<AccountType, AccountBalanceSummary[]>;
}

export class LedgerService {
  /**
   * Helper to retrieve active group.
   */
  private static async getActiveGroup(groupId?: string) {
    if (groupId) {
      const g = await prisma.savingsGroup.findUnique({ where: { id: groupId } });
      if (!g) throw new Error("Specified savings group not found");
      return g;
    }
    const group = await prisma.savingsGroup.findFirst({
      where: { isActive: true },
    });
    if (!group) throw new Error("No active savings group found");
    return group;
  }

  /**
   * Computes the complete Double-Entry Trial Balance.
   * Asserts the fundamental invariant: Total Debits === Total Credits.
   */
  static async getTrialBalance(groupId?: string): Promise<TrialBalanceResult> {
    const group = await this.getActiveGroup(groupId);

    const accounts = await prisma.ledgerAccount.findMany({
      where: { groupId: group.id, isActive: true },
      include: {
        entries: {
          select: {
            direction: true,
            amount: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    let sumTotalDebits = 0;
    let sumTotalCredits = 0;

    const accountSummaries: AccountBalanceSummary[] = accounts.map((acc) => {
      let rawDebits = 0;
      let rawCredits = 0;

      for (const entry of acc.entries) {
        if (entry.direction === LedgerDirection.DEBIT) {
          rawDebits = addPesewas(rawDebits, entry.amount);
        } else {
          rawCredits = addPesewas(rawCredits, entry.amount);
        }
      }

      // Normal balance definitions:
      // Asset & Expense accounts have a normal DEBIT balance (Debits - Credits)
      // Liability, Equity & Revenue accounts have a normal CREDIT balance (Credits - Debits)
      let netBalance = 0;
      let debitBalance = 0;
      let creditBalance = 0;

      if (rawDebits >= rawCredits) {
        debitBalance = subtractPesewas(rawDebits, rawCredits);
      } else {
        creditBalance = subtractPesewas(rawCredits, rawDebits);
      }

      if (acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE) {
        netBalance = subtractPesewas(rawDebits, rawCredits);
      } else {
        netBalance = subtractPesewas(rawCredits, rawDebits);
      }

      sumTotalDebits = addPesewas(sumTotalDebits, debitBalance);
      sumTotalCredits = addPesewas(sumTotalCredits, creditBalance);

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        description: acc.description,
        rawDebits,
        rawCredits,
        debitBalance,
        creditBalance,
        netBalance,
        entryCount: acc.entries.length,
      };
    });

    const isBalanced = sumTotalDebits === sumTotalCredits;
    const differencePesewas = Math.abs(sumTotalDebits - sumTotalCredits);

    return {
      asOf: new Date().toISOString(),
      group: { id: group.id, name: group.name },
      isBalanced,
      totalDebits: sumTotalDebits,
      totalCredits: sumTotalCredits,
      differencePesewas,
      accounts: accountSummaries,
    };
  }

  /**
   * Categorized balance sheet & income statement account summaries.
   * Checks the accounting equation: Assets = Liabilities + Equity + (Revenue - Expenses)
   */
  static async getAccountBalances(
    groupId?: string
  ): Promise<AccountCategorySummary> {
    const trialBalance = await this.getTrialBalance(groupId);

    const accountsByType: Record<AccountType, AccountBalanceSummary[]> = {
      [AccountType.ASSET]: [],
      [AccountType.LIABILITY]: [],
      [AccountType.EQUITY]: [],
      [AccountType.REVENUE]: [],
      [AccountType.EXPENSE]: [],
    };

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpense = 0;

    for (const acc of trialBalance.accounts) {
      accountsByType[acc.type].push(acc);
      switch (acc.type) {
        case AccountType.ASSET:
          totalAssets = addPesewas(totalAssets, acc.netBalance);
          break;
        case AccountType.LIABILITY:
          totalLiabilities = addPesewas(totalLiabilities, acc.netBalance);
          break;
        case AccountType.EQUITY:
          totalEquity = addPesewas(totalEquity, acc.netBalance);
          break;
        case AccountType.REVENUE:
          totalRevenue = addPesewas(totalRevenue, acc.netBalance);
          break;
        case AccountType.EXPENSE:
          totalExpense = addPesewas(totalExpense, acc.netBalance);
          break;
      }
    }

    const netSurplus = subtractPesewas(totalRevenue, totalExpense);
    const rightHandSide = addPesewas(totalLiabilities, totalEquity, netSurplus);
    const isAccountingEquationBalanced = totalAssets === rightHandSide;
    const equationDiscrepancy = Math.abs(totalAssets - rightHandSide);

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpense,
      netSurplus,
      isAccountingEquationBalanced,
      equationDiscrepancy,
      accountsByType,
    };
  }

  /**
   * Cash Reconciliation / Cash Book for Account 1010 (Cash & Clearing Account).
   * Validates all liquid cash inflows vs outflows.
   */
  static async getCashReconciliation(
    groupId?: string
  ): Promise<CashReconciliationResult> {
    const group = await this.getActiveGroup(groupId);

    const cashAccount = await prisma.ledgerAccount.findFirst({
      where: { groupId: group.id, code: "1010" },
    });

    if (!cashAccount) {
      throw new Error(
        "Standard Cash & Clearing Account (1010) not found in group"
      );
    }

    const entries = await prisma.ledgerEntry.findMany({
      where: { accountId: cashAccount.id },
      include: {
        transaction: {
          select: {
            id: true,
            reference: true,
            transactionType: true,
            description: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let openingBalance = 0;
    let totalInflows = 0;
    let totalOutflows = 0;

    const inflowBreakdown = {
      contributions: 0,
      adjustments: 0,
      reversals: 0,
      other: 0,
    };

    const outflowBreakdown = {
      payoutDisbursements: 0,
      paymentReversals: 0,
      adjustments: 0,
      other: 0,
    };

    for (const entry of entries) {
      const type = entry.transaction.transactionType;

      if (entry.direction === LedgerDirection.DEBIT) {
        // Cash Inflow
        totalInflows = addPesewas(totalInflows, entry.amount);
        if (type === TransactionType.CONTRIBUTION) {
          inflowBreakdown.contributions = addPesewas(
            inflowBreakdown.contributions,
            entry.amount
          );
        } else if (type === TransactionType.OPENING_BALANCE) {
          openingBalance = addPesewas(openingBalance, entry.amount);
        } else if (type === TransactionType.ADJUSTMENT) {
          inflowBreakdown.adjustments = addPesewas(
            inflowBreakdown.adjustments,
            entry.amount
          );
        } else if (type === TransactionType.REVERSAL) {
          inflowBreakdown.reversals = addPesewas(
            inflowBreakdown.reversals,
            entry.amount
          );
        } else {
          inflowBreakdown.other = addPesewas(inflowBreakdown.other, entry.amount);
        }
      } else {
        // Cash Outflow
        totalOutflows = addPesewas(totalOutflows, entry.amount);
        if (type === TransactionType.PAYOUT) {
          outflowBreakdown.payoutDisbursements = addPesewas(
            outflowBreakdown.payoutDisbursements,
            entry.amount
          );
        } else if (type === TransactionType.REVERSAL) {
          outflowBreakdown.paymentReversals = addPesewas(
            outflowBreakdown.paymentReversals,
            entry.amount
          );
        } else if (type === TransactionType.ADJUSTMENT) {
          outflowBreakdown.adjustments = addPesewas(
            outflowBreakdown.adjustments,
            entry.amount
          );
        } else {
          outflowBreakdown.other = addPesewas(
            outflowBreakdown.other,
            entry.amount
          );
        }
      }
    }

    const netCashBalance = subtractPesewas(totalInflows, totalOutflows);
    const standardMonthlyPayoutTarget = group.monthlyTarget || 100000; // GH₵1,000.00 default

    const recentMovements = entries.slice(0, 50).map((e) => ({
      id: e.id,
      transactionId: e.transaction.id,
      reference: e.transaction.reference,
      transactionType: e.transaction.transactionType,
      description: e.transaction.description,
      direction: e.direction,
      amount: e.amount,
      createdAt: e.transaction.createdAt.toISOString(),
    }));

    return {
      asOf: new Date().toISOString(),
      group: { id: group.id, name: group.name },
      cashAccountId: cashAccount.id,
      cashAccountCode: cashAccount.code,
      cashAccountName: cashAccount.name,
      openingBalance,
      totalInflows,
      totalOutflows,
      netCashBalance,
      isSolvent: netCashBalance >= 0,
      canCoverFullPayout: netCashBalance >= standardMonthlyPayoutTarget,
      standardMonthlyPayoutTarget,
      inflowBreakdown,
      outflowBreakdown,
      recentMovements,
    };
  }

  /**
   * Search and filter general ledger transactions.
   */
  static async getTransactions(
    filter: Partial<TransactionFilterInput> = {},
    groupId?: string
  ) {
    const group = await this.getActiveGroup(groupId);
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(200, Math.max(1, filter.limit ?? 50));
    const skip = (page - 1) * limit;

    const where: Prisma.LedgerTransactionWhereInput = {
      groupId: group.id,
    };

    if (filter.type) {
      where.transactionType = filter.type;
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.createdAt.lte = new Date(filter.endDate);
      }
    }

    if (filter.accountId) {
      where.entries = {
        some: {
          accountId: filter.accountId,
        },
      };
    }

    if (filter.search && filter.search.trim().length > 0) {
      const q = filter.search.trim();
      where.OR = [
        { reference: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.ledgerTransaction.findMany({
        where,
        include: {
          creator: {
            select: { id: true, email: true, fullName: true },
          },
          entries: {
            include: {
              account: {
                select: { id: true, code: true, name: true, type: true },
              },
            },
            orderBy: [{ direction: "asc" }, { amount: "desc" }],
          },
        },
        orderBy: { createdAt: filter.sortOrder ?? "desc" },
        skip,
        take: limit,
      }),
      prisma.ledgerTransaction.count({ where }),
    ]);

    const formatted = transactions.map((tx) => {
      let totalDebits = 0;
      let totalCredits = 0;

      for (const entry of tx.entries) {
        if (entry.direction === LedgerDirection.DEBIT) {
          totalDebits = addPesewas(totalDebits, entry.amount);
        } else {
          totalCredits = addPesewas(totalCredits, entry.amount);
        }
      }

      return {
        id: tx.id,
        reference: tx.reference,
        transactionType: tx.transactionType,
        description: tx.description,
        sourceType: tx.sourceType,
        sourceId: tx.sourceId,
        createdAt: tx.createdAt.toISOString(),
        createdBy: tx.creator,
        totalDebits,
        totalCredits,
        isBalanced: totalDebits === totalCredits,
        entries: tx.entries.map((e) => ({
          id: e.id,
          accountId: e.accountId,
          accountCode: e.account.code,
          accountName: e.account.name,
          accountType: e.account.type,
          direction: e.direction,
          amount: e.amount,
        })),
      };
    });

    return {
      transactions: formatted,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  /**
   * Get single transaction details by ID.
   */
  static async getTransactionById(id: string) {
    const tx = await prisma.ledgerTransaction.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, email: true, fullName: true },
        },
        entries: {
          include: {
            account: true,
          },
          orderBy: [{ direction: "asc" }, { amount: "desc" }],
        },
      },
    });

    if (!tx) {
      throw new Error(`Ledger transaction with ID "${id}" not found`);
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of tx.entries) {
      if (entry.direction === LedgerDirection.DEBIT) {
        totalDebits = addPesewas(totalDebits, entry.amount);
      } else {
        totalCredits = addPesewas(totalCredits, entry.amount);
      }
    }

    return {
      id: tx.id,
      groupId: tx.groupId,
      reference: tx.reference,
      transactionType: tx.transactionType,
      description: tx.description,
      sourceType: tx.sourceType,
      sourceId: tx.sourceId,
      createdAt: tx.createdAt.toISOString(),
      creator: tx.creator,
      totalDebits,
      totalCredits,
      isBalanced: totalDebits === totalCredits,
      entries: tx.entries.map((e) => ({
        id: e.id,
        accountId: e.accountId,
        accountCode: e.account.code,
        accountName: e.account.name,
        accountType: e.account.type,
        direction: e.direction,
        amount: e.amount,
      })),
    };
  }

  /**
   * Record a manual journal adjustment entry.
   * Strictly enforces balanced Debits = Credits and logs an audit trail.
   */
  static async recordManualAdjustment(
    input: RecordAdjustmentInput,
    adminId: string,
    groupId?: string
  ) {
    const validated = recordAdjustmentSchema.parse(input);
    const group = await this.getActiveGroup(groupId);

    // Verify all accounts exist in this group and are active
    const accountIds = Array.from(new Set(validated.entries.map((e) => e.accountId)));
    const accounts = await prisma.ledgerAccount.findMany({
      where: {
        id: { in: accountIds },
        groupId: group.id,
        isActive: true,
      },
    });

    if (accounts.length !== accountIds.length) {
      throw new Error(
        "One or more ledger accounts specified do not exist or are inactive in this group"
      );
    }

    const reference =
      validated.reference && validated.reference.trim().length > 0
        ? validated.reference.trim()
        : `TXN-ADJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Verify reference is not already used in this group
    const existingRef = await prisma.ledgerTransaction.findFirst({
      where: { groupId: group.id, reference },
    });
    if (existingRef) {
      throw new Error(`Transaction reference "${reference}" already exists`);
    }

    return await prisma.$transaction(async (tx) => {
      const sourceId = crypto.randomUUID();
      const createdTx = await tx.ledgerTransaction.create({
        data: {
          groupId: group.id,
          reference,
          transactionType: TransactionType.ADJUSTMENT,
          description: validated.description,
          sourceType: "ManualAdjustment",
          sourceId,
          createdBy: adminId,
          entries: {
            create: validated.entries.map((entry) => ({
              accountId: entry.accountId,
              direction: entry.direction,
              amount: entry.amountPesewas,
            })),
          },
        },
        include: {
          entries: {
            include: { account: true },
          },
        },
      });

      // Update sourceId to self transaction ID if needed, or maintain reference
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "RECORD_MANUAL_ADJUSTMENT",
          entityType: "LedgerTransaction",
          entityId: createdTx.id,
          newValues: {
            reference: createdTx.reference,
            description: createdTx.description,
            entriesCount: validated.entries.length,
            totalAmount: validated.entries
              .filter((e) => e.direction === LedgerDirection.DEBIT)
              .reduce((sum, e) => sum + e.amountPesewas, 0),
          },
        },
      });

      return createdTx;
    });
  }
}
