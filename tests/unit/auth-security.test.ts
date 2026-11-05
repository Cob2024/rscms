import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  getClientIp,
} from "../../src/lib/auth/rate-limiter";
import { z } from "zod";

describe("Authentication & Administrator Security (Phase 3)", () => {
  const testIp = "192.168.1.100";
  const otherIp = "192.168.1.101";

  beforeEach(() => {
    resetRateLimit(testIp);
    resetRateLimit(otherIp);
  });

  describe("Login Rate Limiting & Brute-Force Protection", () => {
    it("initially allows login attempts with full remaining quota", () => {
      const status = checkRateLimit(testIp, 5, 60000);
      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(5);
      expect(status.retryAfterSeconds).toBe(0);
    });

    it("decrements remaining attempts on failed login", () => {
      const fail1 = recordFailedAttempt(testIp, 5, 60000);
      expect(fail1.blocked).toBe(false);
      expect(fail1.remaining).toBe(4);

      const fail2 = recordFailedAttempt(testIp, 5, 60000);
      expect(fail2.blocked).toBe(false);
      expect(fail2.remaining).toBe(3);
    });

    it("blocks attempts when threshold is reached (e.g. 5 failures)", () => {
      for (let i = 0; i < 4; i++) {
        recordFailedAttempt(testIp, 5, 60000, 60000);
      }

      // 5th failed attempt should trigger lockout
      const fifthAttempt = recordFailedAttempt(testIp, 5, 60000, 60000);
      expect(fifthAttempt.blocked).toBe(true);
      expect(fifthAttempt.remaining).toBe(0);
      expect(fifthAttempt.retryAfterSeconds).toBeGreaterThan(0);

      // Subsequent checks should report not allowed
      const check = checkRateLimit(testIp, 5, 60000);
      expect(check.allowed).toBe(false);
      expect(check.remaining).toBe(0);
      expect(check.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("tracks rate limits separately per IP address", () => {
      // Exhaust attempts for testIp
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(testIp, 5, 60000, 60000);
      }

      expect(checkRateLimit(testIp, 5, 60000).allowed).toBe(false);
      // otherIp should still be allowed
      expect(checkRateLimit(otherIp, 5, 60000).allowed).toBe(true);
      expect(checkRateLimit(otherIp, 5, 60000).remaining).toBe(5);
    });

    it("resets rate limit record when resetRateLimit is called", () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(testIp, 5, 60000, 60000);
      }
      expect(checkRateLimit(testIp, 5, 60000).allowed).toBe(false);

      resetRateLimit(testIp);
      expect(checkRateLimit(testIp, 5, 60000).allowed).toBe(true);
      expect(checkRateLimit(testIp, 5, 60000).remaining).toBe(5);
    });
  });

  describe("Client IP Extraction", () => {
    it("extracts IP from x-forwarded-for header", () => {
      const headers = new Headers();
      headers.set("x-forwarded-for", "203.0.113.195, 70.41.3.18");
      expect(getClientIp(headers)).toBe("203.0.113.195");
    });

    it("extracts IP from x-real-ip header", () => {
      const headers = new Headers();
      headers.set("x-real-ip", "198.51.100.4");
      expect(getClientIp(headers)).toBe("198.51.100.4");
    });

    it("falls back to 127.0.0.1 when no IP headers exist", () => {
      const headers = new Headers();
      expect(getClientIp(headers)).toBe("127.0.0.1");
    });
  });

  describe("Password Recovery Validation", () => {
    const resetPasswordSchema = z
      .object({
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm password is required"),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });

    it("validates matching passwords with sufficient length", () => {
      const result = resetPasswordSchema.safeParse({
        password: "newSecurePassword123",
        confirmPassword: "newSecurePassword123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects mismatched passwords", () => {
      const result = resetPasswordSchema.safeParse({
        password: "newSecurePassword123",
        confirmPassword: "differentPassword456",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords do not match");
      }
    });

    it("rejects passwords under 6 characters", () => {
      const result = resetPasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      });
      expect(result.success).toBe(false);
    });
  });
});

