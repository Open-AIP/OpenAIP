import { describe, expect, it } from "vitest";
import { buildQueryPlan } from "@/lib/chat/query-plan-builder";

describe("query plan builder", () => {
  it("classifies totals ask as structured_only", () => {
    const plan = buildQueryPlan({
      text: "What is the total health budget for 2024?",
      intentClassification: null,
    });
    expect(plan.mode).toBe("structured_only");
    expect(plan.structuredTasks.length).toBeGreaterThan(0);
    expect(plan.semanticTasks).toHaveLength(0);
  });

  it("classifies doc ask as semantic_only", () => {
    const plan = buildQueryPlan({
      text: "What does the AIP say about flood control?",
      intentClassification: null,
    });
    expect(plan.mode).toBe("semantic_only");
    expect(plan.structuredTasks).toHaveLength(0);
    expect(plan.semanticTasks.length).toBeGreaterThan(0);
  });

  it("classifies compare plus explain as mixed", () => {
    const plan = buildQueryPlan({
      text: "Compare the total investment program in 2024 vs 2025, then explain what projects drove the change with citations.",
      intentClassification: null,
    });
    expect(plan.mode).toBe("mixed");
    expect(
      plan.structuredTasks.some(
        (task) => task.routeKind === "SQL_AGG" || task.routeKind === "SQL_TOTAL"
      )
    ).toBe(true);
    expect(plan.semanticTasks.length).toBeGreaterThan(0);
  });

  it("classifies top plus summarize as mixed", () => {
    const plan = buildQueryPlan({
      text: "Show the top 5 projects in 2025 and summarize what the AIP says about each.",
      intentClassification: null,
    });
    expect(plan.mode).toBe("mixed");
    expect(plan.structuredTasks.some((task) => task.routeKind === "SQL_AGG")).toBe(true);
    expect(plan.semanticTasks.length).toBeGreaterThan(0);
  });

  it("does not over-decompose simple semantic asks", () => {
    const plan = buildQueryPlan({
      text: "Explain the drainage project with citations.",
      intentClassification: null,
    });
    expect(plan.mode).toBe("semantic_only");
    expect(plan.structuredTasks).toHaveLength(0);
    expect(plan.semanticTasks).toHaveLength(1);
  });
});
