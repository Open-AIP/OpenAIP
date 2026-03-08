import { describe, expect, it } from "vitest";
import { decideRoute } from "@/lib/chat/router-decision";

describe("router decision", () => {
  it("routes totals asks to pipeline fallback", () => {
    const decision = decideRoute({
      text: "What is the total investment program for FY 2026 in Barangay Pulo?",
      intentClassification: null,
    });

    expect(decision.kind).toBe("PIPELINE_FALLBACK");
    expect(decision.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it("routes aggregation asks to pipeline fallback", () => {
    const decision = decideRoute({
      text: "Show budget totals by fund source for FY 2026 in Barangay Pulo",
      intentClassification: null,
    });

    expect(decision.kind).toBe("PIPELINE_FALLBACK");
  });

  it("routes ref-based asks to pipeline fallback", () => {
    const decision = decideRoute({
      text: "What is allocated for Ref 8000-003-002-006 in FY 2026?",
      intentClassification: null,
    });

    expect(decision.kind).toBe("PIPELINE_FALLBACK");
  });

  it("does not force conversational for opinionated inflated-budget asks", () => {
    const decision = decideRoute({
      text: "Do you think Pulo's FY 2026 AIP has inflated budgets?",
      intentClassification: null,
    });

    expect(decision.kind).toBe("PIPELINE_FALLBACK");
  });

  it("routes metadata asks to pipeline fallback", () => {
    const decision = decideRoute({
      text: "What sectors exist in the AIP?",
      intentClassification: null,
    });

    expect(decision.kind).toBe("PIPELINE_FALLBACK");
  });

  it("selects conversational shortcut when conversational intent has no domain cues", () => {
    const decision = decideRoute({
      text: "hello there",
      intentClassification: {
        intent: "GREETING",
        confidence: 0.95,
        top2_intent: "THANKS",
        top2_confidence: 0.2,
        margin: 0.75,
        method: "semantic",
      },
    });

    expect(decision.kind).toBe("CONVERSATIONAL");
  });

  it("does not let semantic tie-breaker override high-confidence deterministic match", () => {
    const decision = decideRoute({
      text: "What is the total investment program for FY 2026?",
      intentClassification: {
        intent: "LINE_ITEM_LOOKUP",
        confidence: 0.99,
        top2_intent: "TOTAL_AGGREGATION",
        top2_confidence: 0.2,
        margin: 0.79,
        method: "semantic",
      },
    });

    expect(decision.kind).toBe("PIPELINE_FALLBACK");
  });
});
