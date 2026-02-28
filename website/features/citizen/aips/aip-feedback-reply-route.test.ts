import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSupabaseServer = vi.fn();
const mockResolveAipById = vi.fn();
const mockAssertPublishedAipStatus = vi.fn();
const mockRequireCitizenActor = vi.fn();
const mockLoadAipFeedbackRowById = vi.fn();
const mockSanitizeKind = vi.fn();
const mockSanitizeBody = vi.fn();
const mockHydrateAipFeedbackItems = vi.fn();
const mockToErrorResponse = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: () => mockSupabaseServer(),
}));

class MockCitizenAipFeedbackApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

vi.mock("@/app/api/citizen/aips/_feedback-shared", () => ({
  CitizenAipFeedbackApiError: MockCitizenAipFeedbackApiError,
  resolveAipById: mockResolveAipById,
  assertPublishedAipStatus: mockAssertPublishedAipStatus,
  requireCitizenActor: mockRequireCitizenActor,
  loadAipFeedbackRowById: mockLoadAipFeedbackRowById,
  sanitizeCitizenFeedbackKind: mockSanitizeKind,
  sanitizeFeedbackBody: mockSanitizeBody,
  hydrateAipFeedbackItems: mockHydrateAipFeedbackItems,
  toErrorResponse: mockToErrorResponse,
}));

function createInsertClient(insertedRow: Record<string, unknown>) {
  return {
    from: (table: string) => {
      if (table !== "feedback") throw new Error(`Unexpected table: ${table}`);
      return {
        insert: (_payload: unknown) => ({
          select: (_columns: string) => ({
            single: async () => ({
              data: insertedRow,
              error: null,
            }),
          }),
        }),
      };
    },
  };
}

describe("POST /api/citizen/aips/[aipId]/feedback/reply", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockToErrorResponse.mockImplementation(
      () => new Response(JSON.stringify({ error: "mock error" }), { status: 500 })
    );
  });

  it("creates an AIP feedback reply anchored to the root thread", async () => {
    mockSupabaseServer.mockResolvedValue(
      createInsertClient({
        id: "fb-r1",
        target_type: "aip",
        aip_id: "aip-1",
        parent_feedback_id: "fb-root",
        kind: "question",
        body: "Following up.",
        author_id: "citizen-1",
        is_public: true,
        created_at: "2026-01-03T00:00:00.000Z",
      })
    );
    mockResolveAipById.mockResolvedValue({ id: "aip-1", status: "published" });
    mockRequireCitizenActor.mockResolvedValue({ userId: "citizen-1" });
    mockLoadAipFeedbackRowById.mockResolvedValue({
      id: "fb-parent",
      target_type: "aip",
      aip_id: "aip-1",
      parent_feedback_id: "fb-root",
      kind: "question",
      body: "Parent",
      author_id: "citizen-2",
      is_public: true,
      created_at: "2026-01-02T00:00:00.000Z",
    });
    mockSanitizeKind.mockReturnValue("question");
    mockSanitizeBody.mockReturnValue("Following up.");
    mockHydrateAipFeedbackItems.mockResolvedValue([
      {
        id: "fb-r1",
        aipId: "aip-1",
        parentFeedbackId: "fb-root",
        kind: "question",
        body: "Following up.",
        createdAt: "2026-01-03T00:00:00.000Z",
        author: {
          id: "citizen-1",
          fullName: "Citizen",
          role: "citizen",
          roleLabel: "Citizen",
          lguLabel: "Brgy. Unknown",
        },
      },
    ]);

    const { POST } = await import(
      "@/app/api/citizen/aips/[aipId]/feedback/reply/route"
    );
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          parentFeedbackId: "fb-parent",
          kind: "question",
          body: "Following up.",
        }),
      }),
      { params: Promise.resolve({ aipId: "aip-1" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockLoadAipFeedbackRowById).toHaveBeenCalledWith(expect.anything(), "fb-parent");
    expect(body.item.parentFeedbackId).toBe("fb-root");
  });
});
