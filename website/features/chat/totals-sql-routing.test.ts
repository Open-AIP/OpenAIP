import { describe, expect, it, vi } from "vitest";
import { routeSqlFirstTotals, buildTotalsMissingMessage } from "@/lib/chat/totals-sql-routing";

describe("totals SQL-first routing", () => {
  it("uses totals resolver and does not call normal/vector resolver", async () => {
    const resolveTotals = vi.fn(async () => ({ answer: "PHP 77,092,531.00" }));
    const resolveNormal = vi.fn(async () => ({ answer: "vector answer" }));

    const result = await routeSqlFirstTotals({
      intent: "total_investment_program",
      resolveTotals,
      resolveNormal,
    });

    expect(result.path).toBe("totals");
    expect(resolveTotals).toHaveBeenCalledTimes(1);
    expect(resolveNormal).not.toHaveBeenCalled();
  });

  it("returns targeted totals-missing message format", () => {
    const message = buildTotalsMissingMessage({
      fiscalYear: 2025,
      scopeLabel: "Barangay Mamatid",
    });

    expect(message).toContain("I can\u2019t find a 'Total Investment Program' total line extracted for FY 2025");
    expect(message).toContain("Please re-run extraction or check the PDF summary page.");
    expect(message).not.toContain("insufficient evidence across snippets");
  });

  it("routes normal intent to normal resolver", async () => {
    const resolveTotals = vi.fn(async () => ({ answer: "PHP 1.00" }));
    const resolveNormal = vi.fn(async () => ({ answer: "normal path" }));

    const result = await routeSqlFirstTotals({
      intent: "normal",
      resolveTotals,
      resolveNormal,
    });

    expect(result.path).toBe("normal");
    expect(resolveNormal).toHaveBeenCalledTimes(1);
    expect(resolveTotals).not.toHaveBeenCalled();
  });

  it("keeps explicit-scope answer free from account-scope clause and carries explicit log flag", async () => {
    const resolveTotals = vi.fn(async () => ({
      answer: "The Total Investment Program for FY 2026 (Barangay Mamatid) is PHP 219,215,479.00.",
      log: {
        scope_reason: "explicit_barangay",
        explicit_scope_detected: true,
      },
    }));

    const resolveNormal = vi.fn(async () => ({ answer: "vector answer" }));
    const result = await routeSqlFirstTotals({
      intent: "total_investment_program",
      resolveTotals,
      resolveNormal,
    });

    expect(result.path).toBe("totals");
    expect(resolveTotals).toHaveBeenCalledTimes(1);
    expect(resolveNormal).not.toHaveBeenCalled();
    if (result.path !== "totals" || !result.value) {
      throw new Error("Expected totals path value.");
    }
    expect(result.value.answer).not.toContain("based on your account scope");
    expect(result.value.log.explicit_scope_detected).toBe(true);
  });
});
