import { z } from "zod";
import { PaymentChannel, ResolutionType } from "@prisma/client";
import { paymentChannels } from "./payment";

export const resolutionTypes = [
  "POSTPONE_PAYOUT",
  "CARRY_FORWARD",
  "PARTIAL_PAYOUT",
  "CUSTOM",
] as const;

/** Schema to authorize a scheduled payout position */
export const authorizePayoutSchema = z.object({
  amountPesewas: z
    .number({
      required_error: "Authorized amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .int("Authorized amount must be strictly an integer in pesewas")
    .positive("Authorized amount must be greater than zero"),
  resolutionType: z.enum(resolutionTypes).optional(),
  reason: z
    .string()
    .trim()
    .max(1000, "Reason must not exceed 1,000 characters")
    .optional(),
  groupAuthorized: z.boolean().default(false),
});

export type AuthorizePayoutInput = z.infer<typeof authorizePayoutSchema>;

/** Schema to disburse an authorized payout */
export const disbursePayoutSchema = z.object({
  channel: z.enum(paymentChannels, {
    required_error: "Disbursement payment channel is required",
  }),
  reference: z
    .string({ required_error: "Transaction reference is required" })
    .trim()
    .min(2, "Transaction reference must be at least 2 characters")
    .max(120, "Transaction reference must not exceed 120 characters"),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must not exceed 500 characters")
    .optional(),
});

export type DisbursePayoutInput = z.infer<typeof disbursePayoutSchema>;

/** Schema to record recipient acknowledgement */
export const acknowledgePayoutSchema = z.object({
  acknowledgement: z
    .string({ required_error: "Acknowledgement notes are required" })
    .trim()
    .min(3, "Acknowledgement must be at least 3 characters")
    .max(500, "Acknowledgement must not exceed 500 characters"),
});

export type AcknowledgePayoutInput = z.infer<typeof acknowledgePayoutSchema>;

/** Schema to postpone a payout */
export const postponePayoutSchema = z.object({
  reason: z
    .string({ required_error: "A reason is required to postpone a payout" })
    .trim()
    .min(5, "Postponement reason must be at least 5 characters for the audit record")
    .max(1000, "Postponement reason must not exceed 1,000 characters"),
});

export type PostponePayoutInput = z.infer<typeof postponePayoutSchema>;

