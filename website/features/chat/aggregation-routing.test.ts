import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage, ChatSession } from "@/lib/repos/chat/types";

const mockGetActorContext = vi.fn();
const mockResolveRetrievalScope = vi.fn();
const mockRequestPipelineQueryEmbedding = vi.fn();
const mockRequestPipelineChatAnswer = vi.fn();
const mockSupabaseServer = vi.fn();
const mockSupabaseAdmin = vi.fn();
const mockRouteSqlFirstTotals = vi.fn();
const mockGetSession = vi.fn();
const mockCreateSession = vi.fn();
const mockAppendUserMessage = vi.fn();
const mockConsumeQuotaRpc = vi.fn();
const mockServerRpc = vi.fn();

const session: ChatSession = {
  id: "session-1",
  userId: "user-1",
  title: "Chat",
  context: {},
  lastMessageAt: null,
  createdAt: "2026-02-27T00:00:00.000Z",
  updatedAt: "2026-02-27T00:00:00.000Z",
};

type StoredAssistantRow = {
  id: string;
  session_id: string;
  role: "assistant";
  content: string;
  citations: unknown;
  retrieval_meta: unknown;
  created_at: string;
};

let assistantRows: StoredAssistantRow[] = [];
let assistantCounter = 0;
let messageCounter = 0;
let rpcResponses: Record<string, unknown> = {};
let routePostHandler: typeof import("@/app/api/barangay/chat/messages/route").POST | null = null;

function createServerClient() {
  return {
    rpc: async (fn: string, args: Record<string, unknown>) => {
      mockServerRpc(fn, args);
      if (Object.prototype.hasOwnProperty.call(rpcResponses, fn)) {
        return { data: rpcResponses[fn], error: null };
      }
      throw new Error(`Unexpected server rpc: ${fn}`);
    },
    from: (_table: string) => ({
      select: () => ({
        in: async () => ({ data: [], error: null }),
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  };
}

function createAdminClient() {
  return {
    rpc: async (fn: string, args: Record<string, unknown>) => {
      if (fn === "consume_chat_quota") {
        mockConsumeQuotaRpc(fn, args);
        return {
          data: {
            allowed: true,
            reason: "ok",
          },
          error: null,
        };
      }
      throw new Error(`Unexpected admin rpc: ${fn}`);
    },
    from: (table: string) => {
      if (table === "chat_messages") {
        return {
          insert: (payload: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                assistantCounter += 1;
                const row: StoredAssistantRow = {
                  id: `assistant-${assistantCounter}`,
                  session_id: String(payload.session_id),
                  role: "assistant",
                  content: String(payload.content),
                  citations: payload.citations ?? null,
                  retrieval_meta: payload.retrieval_meta ?? null,
                  created_at: new Date(Date.now() + assistantCounter * 1000).toISOString(),
                };
                assistantRows.push(row);
                return { data: row, error: null };
              },
            }),
          }),
          select: () => ({
            eq: (field: string, value: unknown) => {
              if (field !== "session_id") {
                throw new Error(`Unexpected chat_messages select field: ${field}`);
              }
              return {
                eq: (field2: string, value2: unknown) => {
                  if (field2 !== "role" || value2 !== "assistant") {
                    throw new Error(`Unexpected chat_messages role filter: ${field2}`);
                  }
                  return {
                    order: () => ({
                      limit: () => ({
                        maybeSingle: async () => {
                          const rows = assistantRows
                            .filter((row) => row.session_id === String(value))
                            .sort(
                              (a, b) =>
                                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                            );
                          return {
                            data:
                              rows[0] == null
                                ? null
                                : {
                                    id: rows[0].id,
                                    retrieval_meta: rows[0].retrieval_meta,
                                  },
                            error: null,
                          };
                        },
                      }),
                    }),
                  };
                },
              };
            },
          }),
        };
      }

      if (table === "barangays") {
        return {
          select: () => ({
            eq: (_field: string, value: string) => ({
              maybeSingle: async () => ({
                data: { id: value, name: value === "brgy-2" ? "Canlubang" : "Mamatid" },
                error: null,
              }),
            }),
            in: (_field: string, ids: string[]) => ({
              data: ids.map((id) => ({ id, name: id === "brgy-2" ? "Canlubang" : "Mamatid" })),
              error: null,
            }),
          }),
        };
      }

      throw new Error(`Unexpected admin table: ${table}`);
    },
  };
}

vi.mock("@/lib/domain/get-actor-context", () => ({
  getActorContext: () => mockGetActorContext(),
}));

vi.mock("@/lib/repos/chat/repo.server", () => ({
  getChatRepo: () => ({
    getSession: (...args: unknown[]) => mockGetSession(...args),
    createSession: (...args: unknown[]) => mockCreateSession(...args),
    appendUserMessage: (...args: unknown[]) => mockAppendUserMessage(...args),
  }),
}));

vi.mock("@/lib/chat/scope-resolver.server", () => ({
  resolveRetrievalScope: (...args: unknown[]) => mockResolveRetrievalScope(...args),
}));

vi.mock("@/lib/chat/pipeline-client", () => ({
  requestPipelineQueryEmbedding: (...args: unknown[]) =>
    mockRequestPipelineQueryEmbedding(...args),
  requestPipelineChatAnswer: (...args: unknown[]) => mockRequestPipelineChatAnswer(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: () => mockSupabaseServer(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => mockSupabaseAdmin(),
}));

vi.mock("@/lib/chat/totals-sql-routing", () => ({
  routeSqlFirstTotals: (...args: unknown[]) => mockRouteSqlFirstTotals(...args),
  buildTotalsMissingMessage: () => "Totals missing.",
}));

vi.mock("server-only", () => ({}));

async function getRoutePostHandler() {
  if (routePostHandler) return routePostHandler;
  const routeModule = await import("@/app/api/barangay/chat/messages/route");
  routePostHandler = routeModule.POST;
  return routePostHandler;
}

async function callMessagesRoute(input: { sessionId?: string; content: string }) {
  const POST = await getRoutePostHandler();
  const request = new Request("http://localhost/api/barangay/chat/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const response = await POST(request);
  return {
    response,
    payload: (await response.json()) as Record<string, unknown>,
  };
}

describe("aggregation routing", () => {
  beforeEach(() => {
    assistantRows = [];
    assistantCounter = 0;
    messageCounter = 0;
    rpcResponses = {
      get_top_projects: [
        {
          line_item_id: "line-1",
          aip_id: "aip-1",
          fiscal_year: 2026,
          barangay_id: "brgy-1",
          aip_ref_code: "1000-A",
          program_project_title: "Road Concreting",
          fund_source: "General Fund",
          start_date: "2026-01-01",
          end_date: "2026-12-31",
          total: 1000000,
          page_no: 1,
          row_no: 1,
          table_no: 1,
        },
      ],
      get_totals_by_sector: [
        {
          sector_code: "INFRA",
          sector_name: "Infrastructure",
          sector_total: 2500000,
          count_items: 3,
        },
      ],
      get_totals_by_fund_source: [
        {
          fund_source: "General Fund",
          fund_total: 3000000,
          count_items: 4,
        },
      ],
      compare_fiscal_year_totals: [
        {
          year_a_total: 2000000,
          year_b_total: 2500000,
          delta: 500000,
        },
      ],
    };

    mockConsumeQuotaRpc.mockReset();
    mockServerRpc.mockReset();
    mockGetSession.mockReset();
    mockCreateSession.mockReset();
    mockAppendUserMessage.mockReset();
    mockResolveRetrievalScope.mockReset();
    mockGetActorContext.mockReset();
    mockSupabaseServer.mockReset();
    mockSupabaseAdmin.mockReset();
    mockRequestPipelineChatAnswer.mockReset();
    mockRequestPipelineQueryEmbedding.mockReset();
    mockRouteSqlFirstTotals.mockReset();
    routePostHandler = null;

    mockGetActorContext.mockResolvedValue({
      userId: "user-1",
      role: "barangay_official",
      scope: { kind: "barangay", id: "brgy-1" },
    });
    mockGetSession.mockResolvedValue(session);
    mockCreateSession.mockResolvedValue(session);
    mockAppendUserMessage.mockImplementation(async (_sessionId: string, content: string) => {
      messageCounter += 1;
      const message: ChatMessage = {
        id: `user-${messageCounter}`,
        sessionId: session.id,
        role: "user",
        content,
        createdAt: new Date(Date.now() + messageCounter * 1000).toISOString(),
      };
      return message;
    });

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

    mockSupabaseServer.mockResolvedValue(createServerClient());
    mockSupabaseAdmin.mockImplementation(() => createAdminClient());

    mockRequestPipelineQueryEmbedding.mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
      model: "text-embedding-3-large",
      dimensions: 3,
    });
    mockRequestPipelineChatAnswer.mockResolvedValue({
      answer: "Pipeline fallback answer",
      refused: false,
      citations: [],
      retrieval_meta: {
        reason: "ok",
      },
    });

    mockRouteSqlFirstTotals.mockImplementation(
      async (input: {
        intent: string;
        resolveTotals: () => Promise<unknown>;
        resolveNormal: () => Promise<unknown>;
      }) => {
        if (input.intent === "total_investment_program") {
          return {
            path: "totals",
            value: await input.resolveTotals(),
          };
        }
        return {
          path: "normal",
          value: await input.resolveNormal(),
        };
      }
    );
  });

  it("routes Top 3 projects in FY 2026 to get_top_projects with expected filters", async () => {
    const { payload } = await callMessagesRoute({
      sessionId: session.id,
      content: "Top 3 projects in FY 2026",
    });

    expect(payload.status).toBe("answer");
    expect(
      mockServerRpc.mock.calls.some(
        ([fn, args]) =>
          fn === "get_top_projects" &&
          (args as Record<string, unknown>).p_limit === 3 &&
          (args as Record<string, unknown>).p_fiscal_year === 2026 &&
          (args as Record<string, unknown>).p_barangay_id === null
      )
    ).toBe(true);
    expect(
      mockServerRpc.mock.calls.some(([fn]) => fn === "match_aip_line_items")
    ).toBe(false);
    expect(mockRequestPipelineChatAnswer).not.toHaveBeenCalled();
    expect(mockRequestPipelineQueryEmbedding).not.toHaveBeenCalled();
  });

  it("routes totals by sector query to get_totals_by_sector", async () => {
    await callMessagesRoute({
      sessionId: session.id,
      content: "Totals by sector FY 2026",
    });

    expect(
      mockServerRpc.mock.calls.some(
        ([fn, args]) =>
          fn === "get_totals_by_sector" &&
          (args as Record<string, unknown>).p_fiscal_year === 2026
      )
    ).toBe(true);
    expect(
      mockServerRpc.mock.calls.some(([fn]) => fn === "match_aip_line_items")
    ).toBe(false);
    expect(mockRequestPipelineChatAnswer).not.toHaveBeenCalled();
  });

  it("routes compare query to compare_fiscal_year_totals with both years", async () => {
    await callMessagesRoute({
      sessionId: session.id,
      content: "Compare 2025 vs 2026 total budget",
    });

    expect(
      mockServerRpc.mock.calls.some(
        ([fn, args]) =>
          fn === "compare_fiscal_year_totals" &&
          (args as Record<string, unknown>).p_year_a === 2025 &&
          (args as Record<string, unknown>).p_year_b === 2026
      )
    ).toBe(true);
    expect(
      mockServerRpc.mock.calls.some(([fn]) => fn === "match_aip_line_items")
    ).toBe(false);
    expect(mockRequestPipelineChatAnswer).not.toHaveBeenCalled();
  });

  it("applies explicit barangay filter for aggregate query", async () => {
    mockResolveRetrievalScope.mockResolvedValueOnce({
      mode: "named_scopes",
      retrievalScope: {
        mode: "named_scopes",
        targets: [
          {
            scope_type: "barangay",
            scope_id: "brgy-2",
            scope_name: "Canlubang",
          },
        ],
      },
      scopeResolution: {
        mode: "named_scopes",
        requestedScopes: [{ scopeType: "barangay", scopeName: "Canlubang" }],
        resolvedTargets: [{ scopeType: "barangay", scopeId: "brgy-2", scopeName: "Canlubang" }],
        unresolvedScopes: [],
        ambiguousScopes: [],
      },
    });

    await callMessagesRoute({
      sessionId: session.id,
      content: "Top 5 projects in FY 2026 in Barangay Canlubang",
    });

    expect(
      mockServerRpc.mock.calls.some(
        ([fn, args]) =>
          fn === "get_top_projects" &&
          (args as Record<string, unknown>).p_barangay_id === "brgy-2"
      )
    ).toBe(true);
  });

  it("returns clarification when aggregate query is scoped to city/municipality", async () => {
    mockResolveRetrievalScope.mockResolvedValueOnce({
      mode: "named_scopes",
      retrievalScope: {
        mode: "named_scopes",
        targets: [
          {
            scope_type: "city",
            scope_id: "city-1",
            scope_name: "Calamba",
          },
        ],
      },
      scopeResolution: {
        mode: "named_scopes",
        requestedScopes: [{ scopeType: "city", scopeName: "Calamba" }],
        resolvedTargets: [{ scopeType: "city", scopeId: "city-1", scopeName: "Calamba" }],
        unresolvedScopes: [],
        ambiguousScopes: [],
      },
    });

    const { payload } = await callMessagesRoute({
      sessionId: session.id,
      content: "Top 3 projects in FY 2026 in City Calamba",
    });

    expect(payload.status).toBe("clarification");
    const assistant = payload.assistantMessage as { content: string };
    expect(assistant.content).toContain(
      "I can aggregate by one barangay or across all barangays."
    );
    expect(
      mockServerRpc.mock.calls.some(([fn]) => fn === "get_top_projects")
    ).toBe(false);
  });
});
