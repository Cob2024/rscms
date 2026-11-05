/**
 * Shared types for the RSCMS application.
 * Financial types use pesewas (integer) for all monetary values.
 */

// Member status
export type MemberStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

// Contribution status (derived from verified allocations)
export type ContributionStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

// Payment status
export type PaymentStatus = "PENDING" | "VERIFIED" | "REVERSED" | "FAILED";

// Payment channel
export type PaymentChannel =
  | "CASH"
  | "MTN_MOMO"
  | "TELECEL_CASH"
  | "AT_MONEY"
  | "BANK_TRANSFER"
  | "OTHER";

// Payout status
export type PayoutStatus =
  | "SCHEDULED"
  | "AUTHORIZED"
  | "DISBURSED"
  | "ACKNOWLEDGED"
  | "PARTIAL"
  | "POSTPONED";

// Cycle status
export type CycleStatus = "DRAFT" | "ACTIVE" | "RECONCILING" | "COMPLETED";

// Ledger entry direction
export type LedgerDirection = "DEBIT" | "CREDIT";

// Resolution type
export type ResolutionType =
  | "POSTPONE_PAYOUT"
  | "CARRY_FORWARD"
  | "PARTIAL_PAYOUT"
  | "CUSTOM";

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
