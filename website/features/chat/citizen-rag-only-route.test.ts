import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequestPipelineChatAnswer = vi.fn();
const mockGetTypedAppSetting = vi.fn();
const mockIsUserBlocked = vi.fn();
const mockSupabaseServer = vi.fn();
const mockSupabaseAdmin = vi.fn();
const mockConsumeChatQuota = vi.fn();
const mockInsertAssistantChatMessage = vi.fn();
const mockToPrivilegedActorContextFromProfile = vi.fn();

vi.mock("@/lib/chat/pipeline-client", () => ({
  requestPipelineChatAnswer: (...args: unknown[]) => mockRequestPipelineChatAnswer(...args),
}));

vi.mock("@/lib/settings/app-settings", () => ({
  getTypedAppSetting: (...args: unknown[]) => mockGetTypedAppSetting(...args),
  isUserBlocked: (...args: unknown[]) => mockIsUserBlocked(...args),
}));

vi.mock("@/lib/security/csrf", () => ({
  enforceCsrfProtection: () => ({ ok: true }),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: () => mockSupabaseServer(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => mockSupabaseAdmin(),
}));

vi.mock("@/lib/supabase/privileged-ops", () => ({
  consumeChatQuota: (...args: unknown[]) => mockConsumeChatQuota(...args),
  insertAssistantChatMessage: (...args: unknown[]) => mockInsertAssistantChatMessage(...args),
  toPrivilegedActorContextFromProfile: (...args: unknown[]) =>
    mockToPrivilegedActorContextFromProfile(...args),
}));

let postHandler: typeof import("@/app/api/citizen/chat/reply/route").POST | null = null;

async function getPostHandler() {
  if (postHandler) return postHandler;
  const routeModule = await import("@/app/api/citizen/chat/reply/route");
  postHandler = routeModule.POST;
  return postHandler;
}

function makeServerMock() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "chat_sessions") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "session-1", title: "Session", context: {} },
            error: null,
          }),
        };
      }

      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "user-1",
              role: "citizen",
              full_name: "Citizen One",
              barangay_id: "brgy-1",
              city_id: null,
              municipality_id: null,
            },
            error: null,
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  };
}

function makeAdminMock() {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { name: "Barangay One" },
        error: null,
      }),
    })),
  };
}

describe("Citizen chat reply RAG-only route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    postHandler = null;

    mockSupabaseServer.mockResolvedValue(makeServerMock());
    mockSupabaseAdmin.mockReturnValue(makeAdminMock());

    mockGetTypedAppSetting.mockResolvedValue({ maxRequests: 20, timeWindow: "per_hour" });
    mockIsUserBlocked.mockResolvedValue(false);

    mockToPrivilegedActorContextFromProfile.mockReturnValue({
      role: "citizen",
      user_id: "user-1",
      lgu_id: "brgy-1",
      lgu_scope: "barangay",
    });

    mockConsumeChatQuota.mockResolvedValue({ allowed: true, reason: "ok" });

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
  });

  it("always executes pipeline answer path", async () => {
    mockRequestPipelineChatAnswer.mockResolvedValue({
      answer: "Grounded citizen answer",
      refused: false,
      citations: [{ source_id: "c1", snippet: "Evidence snippet" }],
      retrieval_meta: { reason: "ok" },
    });

    const post = await getPostHandler();
    const response = await post(
      new Request("http://localhost/api/citizen/chat/reply", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          session_id: "session-1",
          user_message: "What is the budget?",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      message: { content: string; retrievalMeta: { reason: string } };
      suggestedFollowUps: string[];
    };

    expect(payload.message.content).toBe("Grounded citizen answer");
    expect(payload.message.retrievalMeta.reason).toBe("ok");
    expect(payload.suggestedFollowUps).toEqual([]);
    expect(mockRequestPipelineChatAnswer).toHaveBeenCalledTimes(1);
  });
});
