/**
 * Currency formatting utilities for Ghana Cedis (GHS).
 * All monetary values are stored as integers in pesewas.
 * GH₵1 = 100 pesewas
 * GH₵250 = 25,000 pesewas
 */

const GHS_FORMATTER = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Convert pesewas (integer) to cedis (decimal) for display only.
 * Never use this for calculations.
 */
export function pesewasToCedis(pesewas: number): number {
  return pesewas / 100;
}

/**
 * Convert cedis (decimal) to pesewas (integer) for storage.
 * Rounds to nearest integer to avoid floating-point issues.
 */
export function cedisToPesewas(cedis: number): number {
  if (!Number.isFinite(cedis)) throw new RangeError("Amount must be a finite GHS value");
  const parsed = parseGhsToPesewas(String(cedis));
  if (parsed === null) throw new RangeError("Amount must have no more than two decimal places");
  return parsed;
}

/** Parse a user-entered GHS string directly to integer pesewas. */
export function parseGhsToPesewas(value: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const pesewas = BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0"));
  return pesewas <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(pesewas) : null;
}

/**
 * Format pesewas as Ghana Cedis display string.
 * Example: 25000 → "GH₵250.00"
 */
export function formatPesewas(pesewas: number): string {
  const cedis = pesewasToCedis(pesewas);
  return GHS_FORMATTER.format(cedis);
}

/**
 * Format pesewas as compact display (no currency symbol).
 * Example: 25000 → "250.00"
 */
export function formatPesewasCompact(pesewas: number): string {
  const cedis = pesewasToCedis(pesewas);
  return cedis.toFixed(2);
}

/**
 * Validate that a pesewas value is a positive integer.
 */
export function isValidPesewas(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

/**
 * Safe addition of pesewas values (integer arithmetic).
 */
export function addPesewas(...values: number[]): number {
  const total = values.reduce((sum, val) => sum + val, 0);
  if (!Number.isSafeInteger(total)) throw new RangeError("Pesewa total exceeds the safe integer range");
  return total;
}

/**
 * Safe subtraction of pesewas values (integer arithmetic).
 */
export function subtractPesewas(from: number, ...values: number[]): number {
  const total = values.reduce((result, val) => result - val, from);
  if (!Number.isSafeInteger(total)) throw new RangeError("Pesewa total exceeds the safe integer range");
  return total;
}
