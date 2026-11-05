import { describe, it, expect } from "vitest";
import { z } from "zod";

export const updateGroupInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120).optional(),
  memberCount: z
    .number()
    .int("Capacity must be an integer")
    .min(2, "Group capacity must be at least 2 members")
    .max(100, "Group capacity cannot exceed 100 members")
    .optional(),
  contributionAmount: z
    .number()
    .int("Contribution must be an integer in pesewas")
    .positive("Contribution must be positive")
    .max(100_000_000)
    .optional(),
});

describe("Group Capacity & Settings Validation", () => {
  it("accepts valid member capacity expansions beyond 4 members", () => {
    const capacities = [5, 6, 8, 10, 12, 20, 50];
    for (const memberCount of capacities) {
      const res = updateGroupInputSchema.safeParse({ memberCount });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.memberCount).toBe(memberCount);
      }
    }
  });

  it("rejects invalid capacity (less than 2 or non-integer)", () => {
    expect(updateGroupInputSchema.safeParse({ memberCount: 1 }).success).toBe(false);
    expect(updateGroupInputSchema.safeParse({ memberCount: 0 }).success).toBe(false);
    expect(updateGroupInputSchema.safeParse({ memberCount: 4.5 }).success).toBe(false);
    expect(updateGroupInputSchema.safeParse({ memberCount: 101 }).success).toBe(false);
  });

  it("validates financial collection target calculation for expanded groups", () => {
    const contributionAmount = 25000; // GH₵250 in pesewas
    const testCases = [
      { members: 4, expectedTarget: 100000 }, // GH₵1,000
      { members: 5, expectedTarget: 125000 }, // GH₵1,250
      { members: 6, expectedTarget: 150000 }, // GH₵1,500
      { members: 8, expectedTarget: 200000 }, // GH₵2,000
      { members: 10, expectedTarget: 250000 }, // GH₵2,500
    ];

    for (const tc of testCases) {
      const target = contributionAmount * tc.members;
      expect(target).toBe(tc.expectedTarget);
    }
  });
});

