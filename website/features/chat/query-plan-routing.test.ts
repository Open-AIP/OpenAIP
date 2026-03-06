import { describe, expect, it, vi } from "vitest";
import { executeMixedPlan } from "@/lib/chat/query-plan-executor";
import type { QueryPlan } from "@/lib/chat/query-plan-types";

const basePlan: QueryPlan = {
  mode: "mixed",
  effectiveQuery:
    "Show top projects in 2025 and explain what the AIP says about them with citations.",
  structuredTasks: [
    {
      id: "structured_1",
      kind: "aggregation",
      routeKind: "SQL_AGG",
      subquery: "Show top projects in 2025",
      fiscalYear: 2025,
      missingSlots: [],
    },
  ],
  semanticTasks: [
    {
      id: "semantic_1",
      kind: "narrative",
      subquery: "Explain what the AIP says about those projects with citations.",
      requiresCitations: true,
    },
  ],
  clarificationRequired: false,
  clarificationPrompt: null,
  diagnostics: ["mixed:test"],
};

describe("query plan executor", () => {
  it("executes mixed plan and keeps one merged response", async () => {
    const executeStructuredTask = vi.fn(async () => ({
      taskId: "structured_1",
      kind: "aggregation" as const,
      status: "ok" as const,
      summary: "Top projects computed: 1) Drainage Rehab 2) Daycare Upgrade",
      citations: [
        {
          sourceId: "A1",
          snippet: "Computed from SQL aggregate.",
          metadata: { type: "aggregate" },
        },
      ],
      structuredSnapshot: [{ project: "Drainage Rehab", total: 1000 }],
      conditioningHints: ["Drainage Rehab", "Daycare Upgrade"],
    }));

    const executeSemanticTask = vi.fn(async (_task, hints: string[]) => ({
      taskId: "semantic_1",
      status: "ok" as const,
      answer: `Narrative cites drainage context [S1]. Hints used: ${hints.join(", ")}`,
      citations: [
        {
          sourceId: "S1",
          snippet: "Drainage rehabilitation project narrative",
          metadata: { type: "chunk" },
        },
      ],
      retrievalMeta: {
        reason: "ok",
        multiQueryTriggered: true,
        multiQueryVariantCount: 2,
      },
    }));

    const result = await executeMixedPlan({
      plan: basePlan,
      executeStructuredTask,
      executeSemanticTask,
    });

    expect(executeStructuredTask).toHaveBeenCalledTimes(1);
    expect(executeSemanticTask).toHaveBeenCalledTimes(1);
    expect(result.content).toContain("Computed results from structured published AIP data");
    expect(result.content).toContain("Narrative evidence from published AIP chunks");
    expect(result.verifierMode).toBe("mixed");
    expect(result.semanticConditioningApplied).toBe(true);
    expect(result.selectiveMultiQueryTriggered).toBe(true);
    expect(result.selectiveMultiQueryVariantCount).toBe(2);
  });

  it("returns structured verifier mode when narrative is unavailable", async () => {
    const result = await executeMixedPlan({
      plan: basePlan,
      executeStructuredTask: async () => ({
        taskId: "structured_1",
        kind: "aggregation",
        status: "ok",
        summary: "Top projects computed successfully.",
        citations: [],
        structuredSnapshot: [{ project: "Drainage Rehab", total: 1000 }],
        conditioningHints: ["Drainage Rehab"],
      }),
      executeSemanticTask: async () => ({
        taskId: "semantic_1",
        status: "refuse",
        answer: "Insufficient narrative evidence.",
        citations: [],
        retrievalMeta: {
          reason: "insufficient_evidence",
        },
      }),
    });

    expect(result.responseMode).toBe("partial");
    expect(result.verifierMode).toBe("structured");
    expect(result.narrativeIncluded).toBe(false);
  });
});
