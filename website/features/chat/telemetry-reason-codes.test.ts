import { describe, expect, it } from "vitest";
import {
  inferRouteFamily,
  inferSemanticRetrievalAttempted,
  mapPlannerReasonCode,
  mapResponseModeReasonCode,
  mapRewriteReasonCode,
  mapVerifierReasonCode,
} from "@/lib/chat/telemetry-reason-codes";
import type { ChatCitation, ChatRetrievalMeta } from "@/lib/repos/chat/types";

function baseMeta(overrides: Partial<ChatRetrievalMeta> = {}): ChatRetrievalMeta {
  return {
    refused: false,
    reason: "ok",
    status: "answer",
    verifierMode: "retrieval",
    verifierPolicyPassed: true,
    ...overrides,
  };
}

function citation(metadata: Record<string, unknown>, scopeName?: string): ChatCitation {
  return {
    sourceId: "S1",
    snippet: "snippet",
    scopeType: "barangay",
    scopeName,
    metadata,
  };
}

describe("telemetry reason codes", () => {
  it("maps rewrite reasons", () => {
    expect(mapRewriteReasonCode("safe_year_follow_up")).toBe("followup_year");
    expect(mapRewriteReasonCode("standalone")).toBe("no_rewrite_standalone");
    expect(mapRewriteReasonCode("not_follow_up")).toBe("no_rewrite_non_domain");
  });

  it("maps planner and response reason codes", () => {
    expect(
      mapPlannerReasonCode({
        queryPlanMode: "semantic_only",
        queryPlanClarificationRequired: false,
        queryPlanDiagnostics: [],
      })
    ).toBe("single_route_sufficient");

    expect(
      mapResponseModeReasonCode(baseMeta({ reason: "partial_evidence", mixedResponseMode: "partial" }))
    ).toBe("partial_answer");
  });

  it("maps verifier reason code from mode + pass status", () => {
    expect(mapVerifierReasonCode(baseMeta())).toBe("narrative_grounded");
    expect(
      mapVerifierReasonCode(baseMeta({ verifierMode: "retrieval", verifierPolicyPassed: false }))
    ).toBe("narrative_ungrounded");
  });

  it("infers route family from retrieval telemetry only", () => {
    expect(inferRouteFamily(baseMeta(), [citation({ metadata_intent: "sector_list" })])).toBe(
      "pipeline_fallback"
    );

    expect(
      inferRouteFamily(baseMeta({ denseCandidateCount: 12, evidenceGateDecision: "allow" }), [])
    ).toBe("pipeline_fallback");

    expect(
      inferRouteFamily(baseMeta({ verifierMode: "retrieval" }), [])
    ).toBe("pipeline_fallback");

    expect(inferRouteFamily(baseMeta({ verifierMode: "structured" }), [])).toBe("unknown");
  });

  it("marks semantic retrieval attempted when retrieval signals are present", () => {
    expect(
      inferSemanticRetrievalAttempted(baseMeta({ routeFamily: "pipeline_fallback" }), [])
    ).toBe(true);

    expect(
      inferSemanticRetrievalAttempted(baseMeta({ denseCandidateCount: 2 }), [])
    ).toBe(true);

    expect(inferSemanticRetrievalAttempted(baseMeta(), [])).toBe(false);
  });
});
