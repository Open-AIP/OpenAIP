import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetActorContext = vi.fn();
const mockGetTypedAppSetting = vi.fn();
const mockIsUserBlocked = vi.fn();
const mockGetChatRepo = vi.fn();
const mockConsumeChatQuota = vi.fn();
const mockInsertAssistantChatMessage = vi.fn();
const mockToPrivilegedActorContext = vi.fn();
const mockResolveRetrievalScope = vi.fn();
const mockRequestPipelineChatAnswer = vi.fn();
const mockSupabaseServer = vi.fn();

vi.mock("@/lib/domain/get-actor-context", () => ({
  getActorContext: () => mockGetActorContext(),
}));

vi.mock("@/lib/security/csrf", () => ({
  enforceCsrfProtection: () => ({ ok: true }),
}));

vi.mock("@/lib/settings/app-settings", () => ({
  getTypedAppSetting: (...args: unknown[]) => mockGetTypedAppSetting(...args),
  isUserBlocked: (...args: unknown[]) => mockIsUserBlocked(...args),
}));

vi.mock("@/lib/repos/chat/repo.server", () => ({
  getChatRepo: () => mockGetChatRepo(),
}));

vi.mock("@/lib/supabase/privileged-ops", () => ({
  consumeChatQuota: (...args: unknown[]) => mockConsumeChatQuota(...args),
  insertAssistantChatMessage: (...args: unknown[]) => mockInsertAssistantChatMessage(...args),
  toPrivilegedActorContext: (...args: unknown[]) => mockToPrivilegedActorContext(...args),
}));

vi.mock("@/lib/chat/scope-resolver.server", () => ({
  resolveRetrievalScope: (...args: unknown[]) => mockResolveRetrievalScope(...args),
}));

vi.mock("@/lib/chat/pipeline-client", () => ({
  requestPipelineChatAnswer: (...args: unknown[]) => mockRequestPipelineChatAnswer(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: () => mockSupabaseServer(),
}));

let postHandler: typeof import("@/app/api/barangay/chat/messages/route").POST | null = null;

async function getPostHandler() {
  if (postHandler) return postHandler;
  const routeModule = await import("@/app/api/barangay/chat/messages/route");
  postHandler = routeModule.POST;
  return postHandler;
}

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/barangay/chat/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
    },
    body: JSON.stringify(body),
  });
}

describe("LGU chat messages RAG-only route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    postHandler = null;

    mockGetActorContext.mockResolvedValue({
      userId: "user-1",
      role: "barangay_official",
      scope: { kind: "barangay", id: "brgy-1" },
    });
    mockGetTypedAppSetting.mockResolvedValue({ maxRequests: 20, timeWindow: "per_hour" });
    mockIsUserBlocked.mockResolvedValue(false);
    mockConsumeChatQuota.mockResolvedValue({ allowed: true, reason: "ok" });
    mockToPrivilegedActorContext.mockReturnValue({
      role: "barangay_official",
      user_id: "user-1",
      lgu_id: "brgy-1",
      lgu_scope: "barangay",
    });

    const session = {
      id: "session-1",
      userId: "user-1",
      title: null,
      context: {},
      lastMessageAt: null,
      createdAt: "2026-03-12T00:00:00Z",
      updatedAt: "2026-03-12T00:00:00Z",
    };

    mockGetChatRepo.mockReturnValue({
      getSession: vi.fn().mockResolvedValue(session),
      createSession: vi.fn().mockResolvedValue(session),
      appendUserMessage: vi.fn().mockResolvedValue({
        id: "user-msg-1",
        sessionId: "session-1",
        role: "user",
        content: "question",
        createdAt: "2026-03-12T00:00:00Z",
        citations: null,
        retrievalMeta: null,
      }),
    });

    mockResolveRetrievalScope.mockResolvedValue({
      mode: "global",
      retrievalScope: { mode: "global", targets: [] },
      scopeResolution: {
        mode: "global",
        requestedScopes: [],
        resolvedTargets: [],
        unresolvedScopes: [],
        ambiguousScopes: [],
      },
    });

    mockInsertAssistantChatMessage.mockImplementation(async (input: {
      sessionId: string;
      content: string;
      citations: unknown;
      retrievalMeta: unknown;
    }) => ({
      id: "assistant-1",
      session_id: input.sessionId,
      role: "assistant",
      content: input.content,
      citations: input.citations,
      retrieval_meta: input.retrievalMeta,
      created_at: "2026-03-12T00:00:01Z",
    }));

    mockSupabaseServer.mockResolvedValue({});
  });

  it("calls pipeline once and returns answer response envelope", async () => {
    mockRequestPipelineChatAnswer.mockResolvedValue({
      answer: "Grounded answer",
      refused: false,
      citations: [{ source_id: "c1", snippet: "Evidence snippet" }],
      retrieval_meta: { reason: "ok" },
    });

    const post = await getPostHandler();
    const response = await post(makeRequest({ content: "What is the budget?" }));

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      status: string;
      assistantMessage: { content: string; retrievalMeta: { reason: string } };
    };

    expect(payload.status).toBe("answer");
    expect(payload.assistantMessage.content).toBe("Grounded answer");
    expect(payload.assistantMessage.retrievalMeta.reason).toBe("ok");
    expect(mockRequestPipelineChatAnswer).toHaveBeenCalledTimes(1);
  });

  it("refuses when pipeline returns answer without citations", async () => {
    mockRequestPipelineChatAnswer.mockResolvedValue({
      answer: "Ungrounded answer",
      refused: false,
      citations: [],
      retrieval_meta: { reason: "ok" },
    });

    const post = await getPostHandler();
    const response = await post(makeRequest({ content: "Tell me something" }));

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      status: string;
      assistantMessage: {
        retrievalMeta: { reason: string; status: string };
        citations: Array<{ scopeType: string }>;
      };
    };

    expect(payload.status).toBe("refusal");
    expect(payload.assistantMessage.retrievalMeta.reason).toBe("validation_failed");
    expect(payload.assistantMessage.retrievalMeta.status).toBe("refusal");
    expect(payload.assistantMessage.citations[0]?.scopeType).toBe("system");
  });
});
