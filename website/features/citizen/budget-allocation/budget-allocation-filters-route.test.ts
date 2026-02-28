import { beforeEach, describe, expect, it, vi } from "vitest";

type MockAipRow = {
  id: string;
  status: string;
  fiscal_year: number;
  city_id: string | null;
  barangay_id: string | null;
};

type MockScopeRow = {
  id: string;
  name: string | null;
};

const mockSupabaseServer = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: () => mockSupabaseServer(),
}));

function createAipQueryBuilder(rows: MockAipRow[]) {
  const eqFilters: Array<{ field: string; value: unknown }> = [];
  let requireScoped = false;

  const builder = {
    eq: (field: string, value: unknown) => {
      eqFilters.push({ field, value });
      return builder;
    },
    or: (expression: string) => {
      if (expression === "city_id.not.is.null,barangay_id.not.is.null") {
        requireScoped = true;
      }
      return builder;
    },
    then: (
      resolve: (value: { data: Array<{ fiscal_year: number; city_id: string | null; barangay_id: string | null }>; error: null }) => void,
      reject?: (reason?: unknown) => void
    ) => {
      let filtered = [...rows];
      for (const filter of eqFilters) {
        filtered = filtered.filter((row) => (row as Record<string, unknown>)[filter.field] === filter.value);
      }
      if (requireScoped) {
        filtered = filtered.filter((row) => row.city_id !== null || row.barangay_id !== null);
      }
      const projected = filtered.map((row) => ({
        fiscal_year: row.fiscal_year,
        city_id: row.city_id,
        barangay_id: row.barangay_id,
      }));
      return Promise.resolve({ data: projected, error: null as null }).then(resolve, reject);
    },
  };

  return builder;
}

function createMockClient(input: {
  aips: MockAipRow[];
  cities: MockScopeRow[];
  barangays: MockScopeRow[];
}) {
  return {
    from: (table: string) => {
      if (table === "aips") {
        return {
          select: () => createAipQueryBuilder(input.aips),
        };
      }

      if (table === "cities") {
        return {
          select: () => ({
            in: async (_field: string, ids: string[]) => ({
              data: input.cities.filter((row) => ids.includes(row.id)),
              error: null,
            }),
          }),
        };
      }

      if (table === "barangays") {
        return {
          select: () => ({
            in: async (_field: string, ids: string[]) => ({
              data: input.barangays.filter((row) => ids.includes(row.id)),
              error: null,
            }),
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };
}

const CITY_A = "11111111-1111-4111-8111-111111111111";
const CITY_B = "22222222-2222-4222-8222-222222222222";
const BRGY_A = "33333333-3333-4333-8333-333333333333";
const BRGY_B = "44444444-4444-4444-8444-444444444444";
const CITY_C = "55555555-5555-4555-8555-555555555555";
const BRGY_C = "66666666-6666-4666-8666-666666666666";

describe("GET /api/citizen/budget-allocation/filters", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns only published-backed years and LGUs across city and barangay scopes", async () => {
    mockSupabaseServer.mockResolvedValue(
      createMockClient({
        aips: [
          { id: "aip-city-2026", status: "published", fiscal_year: 2026, city_id: CITY_A, barangay_id: null },
          { id: "aip-brgy-2025", status: "published", fiscal_year: 2025, city_id: null, barangay_id: BRGY_A },
          { id: "aip-draft", status: "draft", fiscal_year: 2027, city_id: CITY_B, barangay_id: null },
        ],
        cities: [
          { id: CITY_A, name: "City of Alpha" },
          { id: CITY_B, name: "City of Beta" },
        ],
        barangays: [{ id: BRGY_A, name: "Brgy. One" }],
      })
    );

    const { GET } = await import("@/app/api/citizen/budget-allocation/filters/route");
    const response = await GET(new Request("http://localhost/api/citizen/budget-allocation/filters"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.has_data).toBe(true);
    expect(body.years).toEqual([2026]);
    expect(body.lgus).toEqual([{ scope_type: "city", scope_id: CITY_A, label: "City of Alpha" }]);
    expect(body.selected).toEqual({
      fiscal_year: 2026,
      scope_type: "city",
      scope_id: CITY_A,
    });
  });

  it("returns 400 for invalid scope params", async () => {
    const { GET } = await import("@/app/api/citizen/budget-allocation/filters/route");
    const response = await GET(
      new Request(
        "http://localhost/api/citizen/budget-allocation/filters?scope_type=city&scope_id=not-a-uuid"
      )
    );

    expect(response.status).toBe(400);
    expect(mockSupabaseServer).not.toHaveBeenCalled();
  });

  it("auto-selects a valid LGU for a valid year when requested LGU is invalid for that year", async () => {
    mockSupabaseServer.mockResolvedValue(
      createMockClient({
        aips: [
          { id: "aip-city-2026", status: "published", fiscal_year: 2026, city_id: CITY_A, barangay_id: null },
          { id: "aip-brgy-2026", status: "published", fiscal_year: 2026, city_id: null, barangay_id: BRGY_A },
          { id: "aip-brgy-2025", status: "published", fiscal_year: 2025, city_id: null, barangay_id: BRGY_B },
        ],
        cities: [{ id: CITY_A, name: "City of Alpha" }],
        barangays: [
          { id: BRGY_A, name: "Brgy. One" },
          { id: BRGY_B, name: "Brgy. Two" },
        ],
      })
    );

    const { GET } = await import("@/app/api/citizen/budget-allocation/filters/route");
    const response = await GET(
      new Request(
        `http://localhost/api/citizen/budget-allocation/filters?fiscal_year=2026&scope_type=barangay&scope_id=${BRGY_B}`
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.selected).toEqual({
      fiscal_year: 2026,
      scope_type: "city",
      scope_id: CITY_A,
    });
    expect(body.lgus).toEqual([
      { scope_type: "city", scope_id: CITY_A, label: "City of Alpha" },
      { scope_type: "barangay", scope_id: BRGY_A, label: "Brgy. One" },
    ]);
  });

  it("auto-selects a valid year for a valid LGU when requested year is invalid for that LGU", async () => {
    mockSupabaseServer.mockResolvedValue(
      createMockClient({
        aips: [
          { id: "aip-city-2026", status: "published", fiscal_year: 2026, city_id: CITY_A, barangay_id: null },
          { id: "aip-brgy-2025", status: "published", fiscal_year: 2025, city_id: null, barangay_id: BRGY_B },
        ],
        cities: [{ id: CITY_A, name: "City of Alpha" }],
        barangays: [{ id: BRGY_B, name: "Brgy. Two" }],
      })
    );

    const { GET } = await import("@/app/api/citizen/budget-allocation/filters/route");
    const response = await GET(
      new Request(
        `http://localhost/api/citizen/budget-allocation/filters?fiscal_year=2030&scope_type=barangay&scope_id=${BRGY_B}`
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.selected).toEqual({
      fiscal_year: 2025,
      scope_type: "barangay",
      scope_id: BRGY_B,
    });
    expect(body.years).toEqual([2025]);
  });

  it("returns has_data=false when there are no published AIPs", async () => {
    mockSupabaseServer.mockResolvedValue(
      createMockClient({
        aips: [],
        cities: [],
        barangays: [],
      })
    );

    const { GET } = await import("@/app/api/citizen/budget-allocation/filters/route");
    const response = await GET(new Request("http://localhost/api/citizen/budget-allocation/filters"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      has_data: false,
      years: [],
      lgus: [],
      selected: null,
    });
  });

  it("normalizes LGU labels by scope type only when type prefix is missing", async () => {
    mockSupabaseServer.mockResolvedValue(
      createMockClient({
        aips: [
          { id: "aip-city-raw", status: "published", fiscal_year: 2026, city_id: CITY_A, barangay_id: null },
          { id: "aip-city-typed", status: "published", fiscal_year: 2026, city_id: CITY_C, barangay_id: null },
          { id: "aip-brgy-raw", status: "published", fiscal_year: 2026, city_id: null, barangay_id: BRGY_A },
          { id: "aip-brgy-brgy", status: "published", fiscal_year: 2026, city_id: null, barangay_id: BRGY_B },
          { id: "aip-brgy-barangay", status: "published", fiscal_year: 2026, city_id: null, barangay_id: BRGY_C },
        ],
        cities: [
          { id: CITY_A, name: "Cabuyao" },
          { id: CITY_C, name: "City of Cabuyao" },
        ],
        barangays: [
          { id: BRGY_A, name: "Mamatid" },
          { id: BRGY_B, name: "Brgy. Banay-banay" },
          { id: BRGY_C, name: "Barangay Pulo" },
        ],
      })
    );

    const { GET } = await import("@/app/api/citizen/budget-allocation/filters/route");
    const response = await GET(
      new Request("http://localhost/api/citizen/budget-allocation/filters?fiscal_year=2026")
    );
    const body = await response.json();

    expect(response.status).toBe(200);

    const labelByScopeId = new Map(
      (body.lgus as Array<{ scope_id: string; label: string }>).map((item) => [item.scope_id, item.label])
    );

    expect(labelByScopeId.get(CITY_A)).toBe("City of Cabuyao");
    expect(labelByScopeId.get(CITY_C)).toBe("City of Cabuyao");
    expect(labelByScopeId.get(BRGY_A)).toBe("Brgy. Mamatid");
    expect(labelByScopeId.get(BRGY_B)).toBe("Brgy. Banay-banay");
    expect(labelByScopeId.get(BRGY_C)).toBe("Barangay Pulo");
  });
});
