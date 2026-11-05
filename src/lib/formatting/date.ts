import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from "date-fns";

/**
 * Format a date for display.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy");
}

/**
 * Format a date with time.
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy, HH:mm");
}

/**
 * Format relative time (e.g., "2 days ago").
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Check if a date is past.
 */
export function isPastDate(date: Date | string): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  return isBefore(d, new Date());
}

/**
 * Check if a date is in the future.
 */
export function isFutureDate(date: Date | string): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  return isAfter(d, new Date());
}

/**
 * Format a month/year display string.
 */
export function formatMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMMM yyyy");
}
