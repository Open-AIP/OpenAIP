import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetActorContext = vi.fn();
const mockSupabaseServer = vi.fn();
const mockSupabaseAdmin = vi.fn();

type MockRow = Record<string, unknown>;

function createThenableQuery(rows: MockRow[]) {
  let filtered = [...rows];

  const query = {
    eq(column: string, value: unknown) {
      filtered = filtered.filter((row) => row[column] === value);
      return query;
    },
    order() {
      return query;
    },
    limit(count: number) {
      filtered = filtered.slice(0, count);
      return query;
    },
    maybeSingle() {
      return Promise.resolve({
        data: filtered[0] ?? null,
        error: null,
      });
    },
  };

  return query;
}

function makeServerClient(dataset?: {
  aips?: MockRow[];
  uploaded_files?: MockRow[];
}) {
  const resolved = {
    aips: dataset?.aips ?? [
      {
        id: "aip-1",
        status: "published",
        barangay_id: "brgy-1",
        city_id: null,
        municipality_id: null,
      },
    ],
    uploaded_files: dataset?.uploaded_files ?? [
      {
        id: "file-1",
        aip_id: "aip-1",
        bucket_id: "aip-files",
        object_name: "published/aip-1.pdf",
        is_current: true,
        created_at: "2026-03-01T00:00:00.000Z",
      },
    ],
  };

  return {
    from: (table: string) => ({
      select: () => createThenableQuery((resolved as Record<string, MockRow[]>)[table] ?? []),
    }),
  };
}

vi.mock("@/lib/domain/get-actor-context", () => ({
  getActorContext: () => mockGetActorContext(),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: () => mockSupabaseServer(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => mockSupabaseAdmin(),
}));

vi.mock("server-only", () => ({}));

describe("GET /api/{barangay|city}/chat/aips/[aipId]/pdf", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockGetActorContext.mockResolvedValue({
      userId: "official-1",
      role: "barangay_official",
      scope: { kind: "barangay", id: "brgy-1" },
    });

    mockSupabaseServer.mockResolvedValue(makeServerClient());
    mockSupabaseAdmin.mockReturnValue({
      storage: {
        from: () => ({
          createSignedUrl: async () => ({
            data: { signedUrl: "https://example.com/barangay-aip.pdf" },
            error: null,
          }),
        }),
      },
    });
  });

  it("returns 307 redirect for barangay totals evidence PDF request", async () => {
    const { GET } = await import("@/app/api/barangay/chat/aips/[aipId]/pdf/route");
    const response = await GET(new Request("http://localhost/api/barangay/chat/aips/aip-1/pdf"), {
      params: Promise.resolve({ aipId: "aip-1" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/barangay-aip.pdf");
  });

  it("returns 307 redirect for city totals evidence PDF request via shared city route", async () => {
    mockGetActorContext.mockResolvedValue({
      userId: "city-official-1",
      role: "city_official",
      scope: { kind: "city", id: "city-1" },
    });
    mockSupabaseServer.mockResolvedValue(
      makeServerClient({
        aips: [
          {
            id: "aip-city-1",
            status: "published",
            barangay_id: null,
            city_id: "city-1",
            municipality_id: null,
          },
        ],
        uploaded_files: [
          {
            id: "file-city-1",
            aip_id: "aip-city-1",
            bucket_id: "aip-files",
            object_name: "published/aip-city-1.pdf",
            is_current: true,
            created_at: "2026-03-01T00:00:00.000Z",
          },
        ],
      })
    );

    const { GET } = await import("@/app/api/city/chat/aips/[aipId]/pdf/route");
    const response = await GET(new Request("http://localhost/api/city/chat/aips/aip-city-1/pdf"), {
      params: Promise.resolve({ aipId: "aip-city-1" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/barangay-aip.pdf");
  });

  it("returns 403 route mismatch when city official calls barangay PDF route", async () => {
    mockGetActorContext.mockResolvedValue({
      userId: "city-official-2",
      role: "city_official",
      scope: { kind: "city", id: "city-1" },
    });

    const { GET } = await import("@/app/api/barangay/chat/aips/[aipId]/pdf/route");
    const response = await GET(new Request("http://localhost/api/barangay/chat/aips/aip-1/pdf"), {
      params: Promise.resolve({ aipId: "aip-1" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: "Use /api/city/chat/messages for city officials.",
    });
  });

  it("returns 404 when AIP is outside the actor LGU scope", async () => {
    mockSupabaseServer.mockResolvedValue(
      makeServerClient({
        aips: [
          {
            id: "aip-out-of-scope",
            status: "published",
            barangay_id: "brgy-2",
            city_id: null,
            municipality_id: null,
          },
        ],
      })
    );

    const { GET } = await import("@/app/api/barangay/chat/aips/[aipId]/pdf/route");
    const response = await GET(
      new Request("http://localhost/api/barangay/chat/aips/aip-out-of-scope/pdf"),
      {
        params: Promise.resolve({ aipId: "aip-out-of-scope" }),
      }
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 when the published AIP has no current uploaded file", async () => {
    mockSupabaseServer.mockResolvedValue(
      makeServerClient({
        uploaded_files: [],
      })
    );

    const { GET } = await import("@/app/api/barangay/chat/aips/[aipId]/pdf/route");
    const response = await GET(new Request("http://localhost/api/barangay/chat/aips/aip-1/pdf"), {
      params: Promise.resolve({ aipId: "aip-1" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 502 when storage URL signing fails", async () => {
    mockSupabaseAdmin.mockReturnValue({
      storage: {
        from: () => ({
          createSignedUrl: async () => ({
            data: null,
            error: { message: "signing error" },
          }),
        }),
      },
    });

    const { GET } = await import("@/app/api/barangay/chat/aips/[aipId]/pdf/route");
    const response = await GET(new Request("http://localhost/api/barangay/chat/aips/aip-1/pdf"), {
      params: Promise.resolve({ aipId: "aip-1" }),
    });

    expect(response.status).toBe(502);
  });
});
