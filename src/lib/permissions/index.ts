/**
 * Permission checking utilities.
 * Currently supports a single administrator role.
 * Can be extended for multi-role support in the future.
 */

export type Role = "admin";

export function isAdmin(role: string | undefined): boolean {
  return role === "admin";
}

export function requireAdmin(role: string | undefined): void {
  if (!isAdmin(role)) {
    throw new Error("Unauthorized: Administrator access required");
  }
}
