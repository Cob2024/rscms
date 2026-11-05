import { z } from "zod";
import { PaymentChannel, PaymentStatus } from "@prisma/client";

/** Supported payment channels in Ghana */
export const paymentChannels = [
  "CASH",
  "MTN_MOMO",
  "TELECEL_CASH",
  "AT_MONEY",
  "BANK_TRANSFER",
  "OTHER",
] as const;

/** Schema to record a manual payment */
export const recordManualPaymentSchema = z.object({
  memberId: z
    .string({ required_error: "Member is required" })
    .uuid("Invalid member identifier"),
  obligationId: z
    .string({ required_error: "Contribution obligation is required" })
    .uuid("Invalid obligation identifier"),
  amountPesewas: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .int("Amount must be stored strictly as integer pesewas")
    .positive("Payment amount must be greater than zero"),
  channel: z.enum(paymentChannels, {
    required_error: "Payment channel is required",
    invalid_type_error: "Invalid payment channel",
  }),
  paymentDate: z
    .string({ required_error: "Payment date is required" })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Please enter a valid payment date",
    }),
  reference: z
    .string({ required_error: "Receipt or transaction reference is required" })
    .trim()
    .min(2, "Reference must be at least 2 characters for audit trail")
    .max(120, "Reference must not exceed 120 characters"),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must not exceed 500 characters")
    .optional()
    .nullable(),
  verifyImmediately: z.boolean().default(true),
});

export type RecordManualPaymentInput = z.infer<typeof recordManualPaymentSchema>;

/** Schema to verify a pending payment */
export const verifyPaymentSchema = z.object({
  obligationId: z
    .string()
    .uuid("Invalid obligation identifier")
    .optional(),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

/** Schema to reverse an existing payment */
export const reversePaymentSchema = z.object({
  reason: z
    .string({ required_error: "A reason is required to reverse a payment" })
    .trim()
    .min(5, "Reversal reason must be at least 5 characters for the audit log")
    .max(500, "Reversal reason must not exceed 500 characters"),
});

export type ReversePaymentInput = z.infer<typeof reversePaymentSchema>;

/** Query filters for listing payments */
export const paymentFilterSchema = z.object({
  memberId: z.string().uuid().optional(),
  channel: z.enum(paymentChannels).optional(),
  status: z
    .enum(["PENDING", "VERIFIED", "REVERSED", "FAILED"] as const)
    .optional(),
  periodId: z.string().uuid().optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type PaymentFilterInput = z.infer<typeof paymentFilterSchema>;

