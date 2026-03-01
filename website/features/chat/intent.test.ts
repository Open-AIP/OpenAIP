import { describe, expect, it } from "vitest";
import { detectIntent, extractFiscalYear } from "@/lib/chat/intent";

describe("chat intent detection", () => {
  it("detects total investment program intent", () => {
    const result = detectIntent("What is the Total Investment Program for FY 2025 (Barangay Mamatid)?");
    expect(result.intent).toBe("total_investment_program");
  });

  it("detects grand total intent without punctuation sensitivity", () => {
    const result = detectIntent("grand total for mamatid fy 2026");
    expect(result.intent).toBe("total_investment_program");
  });

  it("treats scope-level budget queries as total investment program intent", () => {
    const result = detectIntent("What is the budget of Pulo in AIP 2026?");
    expect(result.intent).toBe("total_investment_program");
  });

  it("keeps line-item budget lookups out of totals intent", () => {
    const result = detectIntent("What is the budget for road repair project in FY 2026?");
    expect(result.intent).toBe("normal");
  });

  it("keeps aggregation-style budget breakdowns out of totals intent", () => {
    const result = detectIntent("Show the budget by sector for Pulo in FY 2026.");
    expect(result.intent).toBe("normal");
  });

  it("returns normal intent for non-total queries", () => {
    const result = detectIntent("How many infrastructure projects are ongoing this year?");
    expect(result.intent).toBe("normal");
  });

  it("extracts fiscal year token", () => {
    expect(extractFiscalYear("FY 2025 budget")).toBe(2025);
    expect(extractFiscalYear("No year here")).toBeNull();
  });
});
