import { describe, it, expect } from "vitest";
import { loginSchema } from "../../src/lib/validation";

describe("Auth Validation Schemas", () => {
  it("validates correct login credentials", () => {
    const valid = loginSchema.safeParse({
      email: "admin@example.com",
      password: "securePassword123",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const invalid = loginSchema.safeParse({
      email: "not-an-email",
      password: "securePassword123",
    });
    expect(invalid.success).toBe(false);
  });

  it("rejects short password (< 6 chars)", () => {
    const invalid = loginSchema.safeParse({
      email: "admin@example.com",
      password: "123",
    });
    expect(invalid.success).toBe(false);
  });
});

