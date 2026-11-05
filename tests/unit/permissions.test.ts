import { describe, it, expect } from "vitest";
import { isAdmin, requireAdmin } from "../../src/lib/permissions";

describe("Permissions Utilities", () => {
  it("recognizes 'admin' role correctly", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("user")).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("requireAdmin throws when not admin", () => {
    expect(() => requireAdmin("admin")).not.toThrow();
    expect(() => requireAdmin("user")).toThrow("Unauthorized: Administrator access required");
    expect(() => requireAdmin(undefined)).toThrow("Unauthorized: Administrator access required");
  });
});

