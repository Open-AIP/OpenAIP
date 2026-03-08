import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage, ChatSession } from "@/lib/repos/chat/types";

const mockGetActorContext = vi.fn();
const mockResolveRetrievalScope = vi.fn();
const mockRequestPipelineIntentClassify = vi.fn();
const mockRequestPipelineChatAnswer = vi.fn();
const mockGetSession = vi.fn();
const mockCreateSession = vi.fn();
const mockAppendUserMessage = vi.fn();
const mockListMessages = vi.fn();
const mockGetTypedAppSetting = vi.fn();
const mockIsUserBlocked = vi.fn();
const mockConsumeChatQuota = vi.fn();
const mockInsertAssistantChatMessage = vi.fn();
const mockSupabaseServer = vi.fn();

vi.mock("@/lib/domain/get-actor-context", () => ({
  getActorContext: () => mockGetActorContext(),
}));

vi.mock("@/lib/security/csrf", () => ({
  enforceCsrfProtection: () => ({ ok: true as const }),
}));

vi.mock("@/lib/chat/scope-resolver.server", () => ({
  resolveRetrievalScope: (...args: unknown[]) => mockResolveRetrievalScope(...args),
}));

vi.mock("@/lib/chat/pipeline-client", () => ({
  requestPipelineIntentClassify: (...args: unknown[]) => mockRequestPipelineIntentClassify(...args),
  requestPipelineChatAnswer: (...args: unknown[]) => mockRequestPipelineChatAnswer(...args),
}));

vi.mock("@/lib/repos/chat/repo.server", () => ({
  getChatRepo: () => ({
    getSession: (...args: unknown[]) => mockGetSession(...args),
    createSession: (...args: unknown[]) => mockCreateSession(...args),
    appendUserMessage: (...args: unknown[]) => mockAppendUserMessage(...args),
    listMessages: (...args: unknown[]) => mockListMessages(...args),
  }),
}));

vi.mock("@/lib/settings/app-settings", () => ({
  getTypedAppSetting: (...args: unknown[]) => mockGetTypedAppSetting(...args),
  isUserBlocked: (...args: unknown[]) => mockIsUserBlocked(...args),
}));

vi.mock("@/lib/supabase/privileged-ops", () => ({
  toPrivilegedActorContext: (actor: unknown) => actor,
  consumeChatQuota: (...args: unknown[]) => mockConsumeChatQuota(...args),
  insertAssistantChatMessage: (...args: unknown[]) => mockInsertAssistantChatMessage(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: () => mockSupabaseServer(),
}));

vi.mock("server-only", () => ({}));

let routePostHandler: typeof import("@/app/api/barangay/chat/messages/route").POST | null = null;

async function getRoutePostHandler() {
  if (routePostHandler) return routePostHandler;
  const route = await import("@/app/api/barangay/chat/messages/route");
  routePostHandler = route.POST;
  return routePostHandler;
}

async function callRoute(content: string) {
  const POST = await getRoutePostHandler();
  const request = new Request("http://localhost/api/barangay/chat/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
    },
    body: JSON.stringify({
      sessionId: "session-1",
      content,
    }),
  });

  const response = await POST(request);
  return {
    response,
    payload: (await response.json()) as Record<string, unknown>,
  };
}

const session: ChatSession = {
  id: "session-1",
  userId: "user-1",
  title: "Chat",
  context: {},
  lastMessageAt: null,
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
};

describe("LGU chat route (strict RAG-only)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routePostHandler = null;

    process.env.CHAT_RAG_ONLY_ENFORCED = "true";

    mockGetActorContext.mockResolvedValue({
      userId: "user-1",
      role: "barangay_official",
      scope: { kind: "barangay", id: "brgy-1" },
    });

    mockGetTypedAppSetting.mockResolvedValue({
      maxRequests: 20,
      timeWindow: "per_hour",
    });
    mockIsUserBlocked.mockResolvedValue(false);
    mockConsumeChatQuota.mockResolvedValue({ allowed: true, reason: "ok" });
    mockGetSession.mockResolvedValue(session);
    mockCreateSession.mockResolvedValue(session);

    mockAppendUserMessage.mockImplementation(async (_sessionId: string, content: string) => {
      const message: ChatMessage = {
        id: "user-1-msg",
        sessionId: "session-1",
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      return message;
    });

    mockListMessages.mockResolvedValue([]);
    mockSupabaseServer.mockResolvedValue({});

    mockResolveRetrievalScope.mockResolvedValue({
      mode: "global",
      retrievalScope: {
        mode: "global",
        targets: [],
      },
      scopeResolution: {
        mode: "global",
        requestedScopes: [],
        resolvedTargets: [],
        unresolvedScopes: [],
        ambiguousScopes: [],
      },
    });

    mockRequestPipelineIntentClassify.mockResolvedValue({
      intent: "UNKNOWN",
      confidence: 0,
      top2_intent: null,
      top2_confidence: null,
      margin: 0,
      method: "none",
    });

    mockRequestPipelineChatAnswer.mockResolvedValue({
      answer: "Pipeline answer with citations.",
      refused: false,
      citations: [
        {
          source_id: "S1",
          snippet: "Evidence snippet.",
          scope_type: "barangay",
          scope_name: "Mamatid",
        },
      ],
      retrieval_meta: {
        reason: "ok",
        verifier_mode: "retrieval",
      },
    });

    mockInsertAssistantChatMessage.mockImplementation(async (input: Record<string, unknown>) => ({
      id: "assistant-1",
      session_id: String(input.sessionId),
      role: "assistant",
      content: String(input.content),
      citations: input.citations ?? [],
      retrieval_meta: input.retrievalMeta ?? null,
      created_at: new Date().toISOString(),
    }));
  });

  it("routes answer generation through pipeline only", async () => {
    const { response, payload } = await callRoute("What does the AIP say about drainage projects?");

    expect(response.status).toBe(200);
    expect(payload.status).toBe("answer");
    expect(mockRequestPipelineChatAnswer).toHaveBeenCalledTimes(1);

    const assistant = payload.assistantMessage as {
      retrievalMeta?: { routeFamily?: string; executionPath?: string };
    };
    expect(assistant.retrievalMeta?.routeFamily).toBe("pipeline_fallback");
    expect(assistant.retrievalMeta?.executionPath).toBe("rag_only");
  });

  it("returns clarification when scope resolution is ambiguous without calling pipeline", async () => {
    mockResolveRetrievalScope.mockResolvedValueOnce({
      mode: "ambiguous",
      retrievalScope: null,
      clarificationMessage: "Please specify the exact barangay.",
      scopeResolution: {
        mode: "ambiguous",
        requestedScopes: [{ scopeType: "barangay", scopeName: "Pulo" }],
        resolvedTargets: [],
        unresolvedScopes: ["barangay:Pulo"],
        ambiguousScopes: [],
      },
    });

    const { payload } = await callRoute("What is the budget for Pulo?");

    expect(payload.status).toBe("clarification");
    expect(mockRequestPipelineChatAnswer).not.toHaveBeenCalled();
  });

  it("uses conversational shortcut without retrieval for greeting", async () => {
    mockRequestPipelineIntentClassify.mockResolvedValueOnce({
      intent: "GREETING",
      confidence: 0.99,
      top2_intent: null,
      top2_confidence: null,
      margin: 0.99,
      method: "semantic",
    });

    const { payload } = await callRoute("hello there");

    expect(payload.status).toBe("answer");
    expect(mockRequestPipelineChatAnswer).not.toHaveBeenCalled();

    const assistant = payload.assistantMessage as {
      content: string;
      retrievalMeta?: { routeFamily?: string; executionPath?: string };
    };
    expect(assistant.content.toLowerCase()).toContain("help");
    expect(assistant.retrievalMeta?.routeFamily).toBe("conversational");
    expect(assistant.retrievalMeta?.executionPath).toBe("rag_only");
  });
});
