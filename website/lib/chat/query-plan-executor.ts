import { buildMixedAnswer } from "@/lib/chat/mixed-answer";
import type {
  QueryPlan,
  QueryPlanResponseMode,
  SemanticTaskExecutionResult,
  StructuredTaskExecutionResult,
} from "@/lib/chat/query-plan-types";
import type { ChatCitation } from "@/lib/repos/chat/types";

function dedupeCitations(citations: ChatCitation[]): ChatCitation[] {
  const seen = new Set<string>();
  const unique: ChatCitation[] = [];
  for (const citation of citations) {
    const key = `${citation.sourceId}|${citation.chunkId ?? ""}|${citation.snippet}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(citation);
  }
  return unique;
}

function hintsFromStructured(results: StructuredTaskExecutionResult[]): string[] {
  const hints: string[] = [];
  for (const result of results) {
    if (result.status !== "ok") continue;
    for (const hint of result.conditioningHints) {
      const normalized = hint.trim();
      if (!normalized) continue;
      if (!hints.includes(normalized)) {
        hints.push(normalized);
      }
      if (hints.length >= 8) return hints;
    }
  }
  return hints;
}

export type ExecuteMixedPlanResult = {
  responseMode: QueryPlanResponseMode;
  content: string;
  citations: ChatCitation[];
  verifierMode: "structured" | "retrieval" | "mixed";
  structuredSnapshot: unknown;
  narrativeIncluded: boolean;
  semanticConditioningApplied: boolean;
  semanticConditioningHintCount: number;
  selectiveMultiQueryTriggered: boolean;
  selectiveMultiQueryVariantCount: number;
  diagnostics: string[];
};

export async function executeMixedPlan(input: {
  plan: QueryPlan;
  executeStructuredTask: (task: QueryPlan["structuredTasks"][number]) => Promise<StructuredTaskExecutionResult>;
  executeSemanticTask: (task: QueryPlan["semanticTasks"][number], hints: string[]) => Promise<SemanticTaskExecutionResult>;
}): Promise<ExecuteMixedPlanResult> {
  const diagnostics: string[] = [];
  const structuredResults: StructuredTaskExecutionResult[] = [];

  for (const task of input.plan.structuredTasks) {
    const result = await input.executeStructuredTask(task);
    structuredResults.push(result);
    diagnostics.push(`structured:${task.kind}:${result.status}`);
    if (result.status === "clarify") {
      return {
        responseMode: "clarify",
        content: result.clarificationPrompt ?? "Please clarify the mixed request before I continue.",
        citations: [],
        verifierMode: "structured",
        structuredSnapshot: structuredResults.map((entry) => entry.structuredSnapshot),
        narrativeIncluded: false,
        semanticConditioningApplied: false,
        semanticConditioningHintCount: 0,
        selectiveMultiQueryTriggered: false,
        selectiveMultiQueryVariantCount: 0,
        diagnostics,
      };
    }
  }

  const conditioningHints = hintsFromStructured(structuredResults);
  const semanticResults: SemanticTaskExecutionResult[] = [];

  for (const task of input.plan.semanticTasks) {
    const semantic = await input.executeSemanticTask(task, conditioningHints);
    semanticResults.push(semantic);
    diagnostics.push(`semantic:${task.kind}:${semantic.status}`);
  }

  const mixedAnswer = buildMixedAnswer({
    structuredResults,
    semanticResults,
  });

  const structuredCitations: ChatCitation[] = structuredResults.flatMap((result) =>
    result.citations.map((citation) => ({
      sourceId: citation.sourceId,
      snippet: citation.snippet,
      metadata: citation.metadata,
      scopeType: "system",
      scopeName: "Structured SQL",
      insufficient: false,
    }))
  );
  const semanticCitations: ChatCitation[] = semanticResults.flatMap((result) =>
    result.citations.map((citation) => ({
      sourceId: citation.sourceId,
      snippet: citation.snippet,
      metadata: citation.metadata,
      insufficient: false,
    }))
  );

  const citations = dedupeCitations([...structuredCitations, ...semanticCitations]);
  const narrativeIncluded = mixedAnswer.narrativeIncluded;

  let verifierMode: ExecuteMixedPlanResult["verifierMode"] = "mixed";
  if (!narrativeIncluded) {
    verifierMode = "structured";
  } else if (structuredResults.length === 0) {
    verifierMode = "retrieval";
  }

  const selectiveMultiQueryTriggered = semanticResults.some(
    (entry) => entry.retrievalMeta?.multiQueryTriggered === true
  );
  const selectiveMultiQueryVariantCount = semanticResults.reduce(
    (sum, entry) => sum + (entry.retrievalMeta?.multiQueryVariantCount ?? 0),
    0
  );

  return {
    responseMode: mixedAnswer.responseMode,
    content: mixedAnswer.content,
    citations,
    verifierMode,
    structuredSnapshot: structuredResults.map((entry) => entry.structuredSnapshot),
    narrativeIncluded,
    semanticConditioningApplied: conditioningHints.length > 0,
    semanticConditioningHintCount: conditioningHints.length,
    selectiveMultiQueryTriggered,
    selectiveMultiQueryVariantCount,
    diagnostics,
  };
}
