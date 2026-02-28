import { beforeEach, describe, expect, it, vi } from "vitest";

type ProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
  email: string | null;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
} | null;

type BarangayRow = {
  id: string;
  name: string;
  city_id: string | null;
  municipality_id: string | null;
} | null;

type CityRow = {
  id: string;
  name: string;
  province_id: string | null;
} | null;

type MunicipalityRow = {
  id: string;
  name: string;
  province_id: string | null;
} | null;

type ProvinceRow = {
  id: string;
  name: string;
} | null;

const mockSupabaseServer = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: () => mockSupabaseServer(),
}));

function createMockClient(input: {
  userId: string | null;
  profile: ProfileRow;
  barangay: BarangayRow;
  city: CityRow;
  municipality: MunicipalityRow;
  province: ProvinceRow;
}) {
  return {
    auth: {
      getUser: async () => ({
        data: { user: input.userId ? { id: input.userId, email: "citizen@example.com", user_metadata: {} } : null },
        error: null,
      }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: (_field: string, value: string) => ({
          maybeSingle: async () => {
            if (table === "profiles") {
              return {
                data: input.profile && input.profile.id === value ? input.profile : null,
                error: null,
              };
            }
            if (table === "barangays") {
              return {
                data: input.barangay && input.barangay.id === value ? input.barangay : null,
                error: null,
              };
            }
            if (table === "cities") {
              return {
                data: input.city && input.city.id === value ? input.city : null,
                error: null,
              };
            }
            if (table === "municipalities") {
              return {
                data:
                  input.municipality && input.municipality.id === value ? input.municipality : null,
                error: null,
              };
            }
            if (table === "provinces") {
              return {
                data: input.province && input.province.id === value ? input.province : null,
                error: null,
              };
            }
            throw new Error(`Unexpected table: ${table}`);
          },
        }),
      }),
    }),
  };
}

describe("GET /profile/me", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockSupabaseServer.mockResolvedValue(
      createMockClient({
        userId: null,
        profile: null,
        barangay: null,
        city: null,
        municipality: null,
        province: null,
      })
    );

    const { GET } = await import("@/app/profile/me/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error.message).toContain("Authentication required");
  });

  it("returns 403 for non-citizen users", async () => {
    mockSupabaseServer.mockResolvedValue(
      createMockClient({
        userId: "user-1",
        profile: {
          id: "user-1",
          role: "city_official",
          full_name: "City User",
          email: "city@example.com",
          barangay_id: "brgy-1",
          city_id: "city-1",
          municipality_id: null,
        },
        barangay: null,
        city: null,
        municipality: null,
        province: null,
      })
    );

    const { GET } = await import("@/app/profile/me/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.ok).toBe(false);
    expect(body.error.message).toContain("only for citizen");
  });

  it("returns profile payload and infers city/province from barangay for legacy profile rows", async () => {
    mockSupabaseServer.mockResolvedValue(
      createMockClient({
        userId: "user-1",
        profile: {
          id: "user-1",
          role: "citizen",
          full_name: "Juan Dela Cruz",
          email: "juan@example.com",
          barangay_id: "brgy-1",
          city_id: null,
          municipality_id: null,
        },
        barangay: {
          id: "brgy-1",
          name: "Barangay Uno",
          city_id: "city-1",
          municipality_id: null,
        },
        city: {
          id: "city-1",
          name: "Cabuyao",
          province_id: "prov-1",
        },
        municipality: null,
        province: {
          id: "prov-1",
          name: "Laguna",
        },
      })
    );

    const { GET } = await import("@/app/profile/me/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body).toMatchObject({
      fullName: "Juan Dela Cruz",
      email: "juan@example.com",
      firstName: "Juan",
      lastName: "Dela Cruz",
      barangay: "Barangay Uno",
      city: "Cabuyao",
      province: "Laguna",
    });
  });
});
