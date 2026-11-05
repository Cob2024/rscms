import { z } from "zod";
import { LedgerDirection, TransactionType, AccountType } from "@prisma/client";

/**
 * Validation schema for a single entry within a manual adjustment.
 */
export const adjustmentEntrySchema = z.object({
  accountId: z.string().uuid("Invalid ledger account ID"),
  direction: z.nativeEnum(LedgerDirection, {
    errorMap: () => ({ message: "Direction must be DEBIT or CREDIT" }),
  }),
  amountPesewas: z
    .number({ required_error: "Amount in pesewas is required" })
    .int("Amount must be strictly an integer in pesewas")
    .positive("Amount must be greater than zero pesewas"),
});

/**
 * Validation schema for recording a manual journal adjustment.
 * Enforces:
 * 1. At least 2 entries.
 * 2. Sum of all DEBIT entries strictly equals sum of all CREDIT entries.
 * 3. At least one DEBIT and at least one CREDIT entry.
 */
export const recordAdjustmentSchema = z
  .object({
    reference: z
      .string()
      .trim()
      .max(64, "Reference cannot exceed 64 characters")
      .optional()
      .or(z.literal("")),
    description: z
      .string({ required_error: "Description/reason is required" })
      .trim()
      .min(5, "Description must be at least 5 characters")
      .max(500, "Description cannot exceed 500 characters"),
    entries: z
      .array(adjustmentEntrySchema)
      .min(2, "An adjustment must have at least 2 ledger entries"),
  })
  .refine(
    (data) => {
      const hasDebit = data.entries.some(
        (e) => e.direction === LedgerDirection.DEBIT
      );
      const hasCredit = data.entries.some(
        (e) => e.direction === LedgerDirection.CREDIT
      );
      return hasDebit && hasCredit;
    },
    {
      message:
        "Double-entry adjustment must include at least one DEBIT and one CREDIT entry",
      path: ["entries"],
    }
  )
  .refine(
    (data) => {
      const totalDebits = data.entries
        .filter((e) => e.direction === LedgerDirection.DEBIT)
        .reduce((sum, e) => sum + e.amountPesewas, 0);
      const totalCredits = data.entries
        .filter((e) => e.direction === LedgerDirection.CREDIT)
        .reduce((sum, e) => sum + e.amountPesewas, 0);

      return totalDebits === totalCredits;
    },
    {
      message:
        "Double-entry invariant violated: Total Debits must exactly equal Total Credits",
      path: ["entries"],
    }
  );

export type RecordAdjustmentInput = z.infer<typeof recordAdjustmentSchema>;
export type AdjustmentEntryInput = z.infer<typeof adjustmentEntrySchema>;

/**
 * Validation schema for filtering transactions in the general ledger.
 */
export const transactionFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  type: z.nativeEnum(TransactionType).optional(),
  accountId: z.string().uuid().optional(),
  search: z.string().trim().max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;

