import { beforeEach, describe, expect, it, vi } from "vitest";

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
  profiles?: MockRow[];
  aips?: MockRow[];
  uploaded_files?: MockRow[];
  authUserId?: string | null;
}) {
  const resolved = {
    profiles: dataset?.profiles ?? [
      {
        id: "citizen-1",
        role: "citizen",
        full_name: "Citizen User",
        barangay_id: "brgy-1",
        city_id: null,
        municipality_id: null,
      },
    ],
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
    authUserId: dataset?.authUserId ?? "citizen-1",
  };

  return {
    auth: {
      getUser: async () => ({
        data: { user: resolved.authUserId ? { id: resolved.authUserId } : null },
        error: resolved.authUserId ? null : { message: "Unauthorized" },
      }),
    },
    from: (table: string) => {
      const tableRows: Record<string, MockRow[]> = {
        profiles: resolved.profiles,
        aips: resolved.aips,
        uploaded_files: resolved.uploaded_files,
      };
      return {
        select: () => createThenableQuery(tableRows[table] ?? []),
      };
    },
  };
}

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: () => mockSupabaseServer(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => mockSupabaseAdmin(),
}));

vi.mock("server-only", () => ({}));

describe("GET /api/citizen/chat/aips/[aipId]/pdf", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockSupabaseServer.mockResolvedValue(makeServerClient());
    mockSupabaseAdmin.mockReturnValue({
      storage: {
        from: () => ({
          createSignedUrl: async () => ({
            data: { signedUrl: "https://example.com/aip-1.pdf" },
            error: null,
          }),
        }),
      },
    });
  });

  it("returns 307 redirect to signed AIP PDF URL for valid citizen access", async () => {
    const { GET } = await import("@/app/api/citizen/chat/aips/[aipId]/pdf/route");
    const response = await GET(new Request("http://localhost/api/citizen/chat/aips/aip-1/pdf"), {
      params: Promise.resolve({ aipId: "aip-1" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/aip-1.pdf");
  });

  it("returns 404 when the target published AIP does not exist", async () => {
    mockSupabaseServer.mockResolvedValue(
      makeServerClient({
        aips: [],
      })
    );

    const { GET } = await import("@/app/api/citizen/chat/aips/[aipId]/pdf/route");
    const response = await GET(new Request("http://localhost/api/citizen/chat/aips/missing/pdf"), {
      params: Promise.resolve({ aipId: "missing" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 when no current uploaded PDF exists for the AIP", async () => {
    mockSupabaseServer.mockResolvedValue(
      makeServerClient({
        uploaded_files: [],
      })
    );

    const { GET } = await import("@/app/api/citizen/chat/aips/[aipId]/pdf/route");
    const response = await GET(new Request("http://localhost/api/citizen/chat/aips/aip-1/pdf"), {
      params: Promise.resolve({ aipId: "aip-1" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 502 when signed URL generation fails", async () => {
    mockSupabaseAdmin.mockReturnValue({
      storage: {
        from: () => ({
          createSignedUrl: async () => ({
            data: null,
            error: { message: "storage signing failure" },
          }),
        }),
      },
    });

    const { GET } = await import("@/app/api/citizen/chat/aips/[aipId]/pdf/route");
    const response = await GET(new Request("http://localhost/api/citizen/chat/aips/aip-1/pdf"), {
      params: Promise.resolve({ aipId: "aip-1" }),
    });

    expect(response.status).toBe(502);
  });
});
