export type DerivedContributionStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "OVERDUE_PARTIAL";

/** Derive an obligation's status exclusively from verified pesewa allocations. */
export function deriveContributionStatus(amountPesewas: number, verifiedPesewas: number, dueDate: Date, asOf = new Date()): DerivedContributionStatus {
  if (!Number.isSafeInteger(amountPesewas) || amountPesewas <= 0 || !Number.isSafeInteger(verifiedPesewas) || verifiedPesewas < 0) {
    throw new RangeError("Contribution amounts must be non-negative safe integer pesewas");
  }
  if (verifiedPesewas >= amountPesewas) return "PAID";
  const overdue = asOf.getTime() > dueDate.getTime();
  if (verifiedPesewas > 0) return overdue ? "OVERDUE_PARTIAL" : "PARTIAL";
  return overdue ? "OVERDUE" : "PENDING";
}
