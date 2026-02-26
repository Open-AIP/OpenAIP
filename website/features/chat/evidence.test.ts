import { describe, expect, it } from "vitest";
import { formatTotalsEvidence } from "@/lib/chat/evidence";

describe("formatTotalsEvidence", () => {
  it("extracts the total investment program segment and removes footer phrases", () => {
    const formatted = formatTotalsEvidence(
      "Budget Summary | TOTAL INVESTMENT PROGRAM: 219,215,479.00 Prepared by: ABC Approved by: XYZ"
    );

    expect(formatted).toBe("TOTAL INVESTMENT PROGRAM 219,215,479.00");
    expect(formatted).not.toContain("Prepared by");
    expect(formatted).not.toContain("Approved by");
  });

  it("normalizes whitespace in formatted evidence", () => {
    const formatted = formatTotalsEvidence(
      "TOTAL   INVESTMENT   PROGRAM   77,092,531.00   Reviewed by: Unit Head"
    );

    expect(formatted).toBe("TOTAL INVESTMENT PROGRAM 77,092,531.00");
    expect(formatted).not.toContain("Reviewed by");
  });

  it("falls back to original text trimmed to 180 characters when keyword is missing", () => {
    const source = `This text has no totals keyword ${"x".repeat(260)}`;
    const formatted = formatTotalsEvidence(source);

    expect(formatted.length).toBeLessThanOrEqual(180);
    expect(formatted).toContain("This text has no totals keyword");
  });

  it("extracts a concise grand total snippet from noisy investment program lines", () => {
    const formatted = formatTotalsEvidence(
      "INVESTMENT | PROGRAM Grand Total 11,111.11 22,222.22 33,333.33 65,824,308.28 Reviewed by: Unit Head"
    );

    expect(formatted).toContain("INVESTMENT PROGRAM Grand Total 65,824,308.28");
    expect(formatted).not.toContain("11,111.11");
    expect(formatted).not.toContain("Reviewed by");
  });
});
