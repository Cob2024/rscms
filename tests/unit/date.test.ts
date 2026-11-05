import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatMonthYear,
  isPastDate,
  isFutureDate,
} from "../../src/lib/formatting/date";

describe("Date Formatting Utilities", () => {
  it("formats date to 'dd MMM yyyy'", () => {
    const d = new Date(2025, 0, 15); // 15 Jan 2025
    expect(formatDate(d)).toBe("15 Jan 2025");
  });

  it("formats date with time", () => {
    const d = new Date(2025, 0, 15, 14, 30);
    expect(formatDateTime(d)).toBe("15 Jan 2025, 14:30");
  });

  it("formats month and year", () => {
    const d = new Date(2025, 0, 15);
    expect(formatMonthYear(d)).toBe("January 2025");
  });

  it("identifies past and future dates correctly", () => {
    const past = new Date(2020, 0, 1);
    const future = new Date(2030, 0, 1);

    expect(isPastDate(past)).toBe(true);
    expect(isFutureDate(past)).toBe(false);

    expect(isPastDate(future)).toBe(false);
    expect(isFutureDate(future)).toBe(true);
  });
});

