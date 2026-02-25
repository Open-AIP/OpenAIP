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
});
