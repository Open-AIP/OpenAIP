import { describe, expect, it } from "vitest";
import { normalizeDateForStorage, toDateInputValue } from "./date-normalization";

describe("date-normalization", () => {
  it("keeps YYYY-MM-DD unchanged", () => {
    expect(toDateInputValue("2026-03-15")).toBe("2026-03-15");
    expect(normalizeDateForStorage("2026-03-15", "Start date")).toBe("2026-03-15");
  });

  it("keeps leading date for timestamp with timezone", () => {
    const input = "2026-01-01T00:30:00+08:00";
    expect(toDateInputValue(input)).toBe("2026-01-01");
    expect(normalizeDateForStorage(input, "Completion date")).toBe("2026-01-01");
  });

  it("parses human-readable date strings without UTC slicing", () => {
    const input = "March 10, 2026";
    expect(toDateInputValue(input)).toBe("2026-03-10");
    expect(normalizeDateForStorage(input, "Start date")).toBe("2026-03-10");
  });

  it("returns undefined for invalid or empty input", () => {
    expect(toDateInputValue("")).toBeUndefined();
    expect(toDateInputValue("not a real date")).toBeUndefined();
  });

  it("throws labeled error for invalid storage values", () => {
    expect(() => normalizeDateForStorage("not a real date", "Start date")).toThrow(
      "Start date must be a valid date."
    );
  });
});

