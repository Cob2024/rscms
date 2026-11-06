import { z } from "zod";
import { MemberStatus } from "@prisma/client";

// Ghanaian phone number regex pattern: supports +233XXXXXXXXX or 0XXXXXXXXX
export const ghanaPhoneRegex = /^(?:\+233|0)[235][0-9]{8}$/;

export const createMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(120, "Full name must not exceed 120 characters"),
  phoneNumber: z
    .string()
    .trim()
    .min(9, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(
      /^(?:\+233|0)[0-9]{9}$/,
      "Please enter a valid Ghanaian phone number (e.g. +233240000000 or 0240000000)"
    ),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .or(z.literal(""))
    .nullable()
    .optional(),
  rotationPosition: z
    .number()
    .int("Rotation position must be an integer")
    .min(1, "Rotation position must be at least 1")
    .max(100, "Rotation position cannot exceed 100"),
});

export const updateMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(120, "Full name must not exceed 120 characters")
    .optional(),
  phoneNumber: z
    .string()
    .trim()
    .min(9, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(
      /^(?:\+233|0)[0-9]{9}$/,
      "Please enter a valid Ghanaian phone number (e.g. +233240000000 or 0240000000)"
    )
    .optional(),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .or(z.literal(""))
    .nullable()
    .optional(),
  rotationPosition: z
    .number()
    .int()
    .min(1, "Rotation position must be at least 1")
    .max(100, "Rotation position cannot exceed 100")
    .optional(),
});

export const updateMemberStatusSchema = z.object({
  status: z.nativeEnum(MemberStatus),
  reason: z.string().trim().max(250).optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type UpdateMemberStatusInput = z.infer<typeof updateMemberStatusSchema>;

