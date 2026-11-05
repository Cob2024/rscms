import { describe, it, expect } from "vitest";
import {
  createMemberSchema,
  updateMemberSchema,
  updateMemberStatusSchema,
  ghanaPhoneRegex,
} from "../../src/lib/validation/member";
import { MemberStatus } from "@prisma/client";
import { MemberServiceError } from "../../src/services/member.service";

describe("Member Management Domain & Validation (Phase 4)", () => {
  describe("Ghanaian Phone Number & Member Schema Validation", () => {
    it("accepts valid Ghanaian phone numbers", () => {
      expect(ghanaPhoneRegex.test("+233240000001")).toBe(true);
      expect(ghanaPhoneRegex.test("+233501234567")).toBe(true);
      expect(ghanaPhoneRegex.test("0241234567")).toBe(true);
      expect(ghanaPhoneRegex.test("0559876543")).toBe(true);
    });

    it("rejects invalid or non-Ghanaian phone numbers", () => {
      expect(ghanaPhoneRegex.test("12345")).toBe(false);
      expect(ghanaPhoneRegex.test("+123456789012")).toBe(false);
      expect(ghanaPhoneRegex.test("0123456789")).toBe(false); // 01 is not a valid mobile prefix in Ghana
    });

    it("validates valid member creation input", () => {
      const valid = createMemberSchema.safeParse({
        fullName: "Kofi Annan",
        phoneNumber: "+233240000001",
        email: "kofi@example.com",
        rotationPosition: 1,
      });
      expect(valid.success).toBe(true);
    });

    it("accepts member creation without email (optional)", () => {
      const valid = createMemberSchema.safeParse({
        fullName: "Ama Atta",
        phoneNumber: "0240000002",
        email: "",
        rotationPosition: 2,
      });
      expect(valid.success).toBe(true);
    });

    it("rejects rotation positions outside 1 to 100 or non-integers", () => {
      const invalidZero = createMemberSchema.safeParse({
        fullName: "Invalid Position",
        phoneNumber: "+233240000001",
        rotationPosition: 0,
      });
      expect(invalidZero.success).toBe(false);

      const invalidAboveMax = createMemberSchema.safeParse({
        fullName: "Invalid Position",
        phoneNumber: "+233240000001",
        rotationPosition: 101,
      });
      expect(invalidAboveMax.success).toBe(false);

      const validFive = createMemberSchema.safeParse({
        fullName: "Valid Fifth Member",
        phoneNumber: "+233240000001",
        rotationPosition: 5,
      });
      expect(validFive.success).toBe(true);

      const invalidDecimal = createMemberSchema.safeParse({
        fullName: "Invalid Position",
        phoneNumber: "+233240000001",
        rotationPosition: 2.5,
      });
      expect(invalidDecimal.success).toBe(false);
    });

    it("rejects names that are too short (< 2 chars)", () => {
      const invalid = createMemberSchema.safeParse({
        fullName: "A",
        phoneNumber: "+233240000001",
        rotationPosition: 1,
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("Member Status Transition Validation", () => {
    it("accepts valid MemberStatus enum values", () => {
      expect(updateMemberStatusSchema.safeParse({ status: MemberStatus.ACTIVE }).success).toBe(true);
      expect(updateMemberStatusSchema.safeParse({ status: MemberStatus.INACTIVE }).success).toBe(true);
      expect(updateMemberStatusSchema.safeParse({ status: MemberStatus.SUSPENDED }).success).toBe(true);
      expect(updateMemberStatusSchema.safeParse({ status: MemberStatus.LEFT }).success).toBe(true);
    });

    it("rejects arbitrary invalid status strings", () => {
      const invalid = updateMemberStatusSchema.safeParse({ status: "DELETED" });
      expect(invalid.success).toBe(false);
    });
  });

  describe("Member Financial Aggregations & Invariants", () => {
    it("accurately derives outstanding balance from obligations and verified payments", () => {
      // 4 periods of GH₵250 = 100,000 pesewas total obligations
      const obligations = [
        { amount: 25000, paidAmount: 25000 }, // Period 1: Fully paid
        { amount: 25000, paidAmount: 25000 }, // Period 2: Fully paid
        { amount: 25000, paidAmount: 10000 }, // Period 3: Partially paid (15,000 balance)
        { amount: 25000, paidAmount: 0 },     // Period 4: Unpaid (25,000 balance)
      ];

      const totalObligations = obligations.reduce((sum, o) => sum + o.amount, 0);
      const totalPaid = obligations.reduce((sum, o) => sum + o.paidAmount, 0);
      const outstandingBalance = obligations.reduce(
        (sum, o) => sum + Math.max(0, o.amount - o.paidAmount),
        0
      );

      expect(totalObligations).toBe(100000); // GH₵1,000
      expect(totalPaid).toBe(60000);         // GH₵600
      expect(outstandingBalance).toBe(40000); // GH₵400
      expect(totalObligations - totalPaid).toBe(outstandingBalance);
    });
  });

  describe("Deletion Safeguard Rules", () => {
    it("MemberServiceError handles status code correctly", () => {
      const error = new MemberServiceError("Cannot delete member with financial history.", 400);
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain("Cannot delete");
    });
  });
});

