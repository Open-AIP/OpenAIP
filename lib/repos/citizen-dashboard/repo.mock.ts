import { CITIZEN_DASHBOARD_FIXTURE } from "@/mocks/fixtures/citizen/citizen-dashboard.fixture";
import type { AipRow, BarangayRow } from "@/lib/contracts/databasev2";
import type {
  CitizenDashboardData,
  CitizenDashboardFilters,
  CitizenDashboardRepo,
  CitizenScopeType,
} from "./types";

function toTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const stamp = new Date(value).getTime();
  return Number.isNaN(stamp) ? 0 : stamp;
}

function aipInScope(
  aip: AipRow,
  scopeType: CitizenScopeType,
  scopeId: string,
  barangayById: Map<string, BarangayRow>
): boolean {
  if (scopeType === "barangay") {
    return aip.barangay_id === scopeId;
  }

  if (aip.city_id === scopeId) {
    return true;
  }

  if (!aip.barangay_id) {
    return false;
  }

  return barangayById.get(aip.barangay_id)?.city_id === scopeId;
}

function resolveScope(
  input: CitizenDashboardFilters,
  cityIds: Set<string>,
  barangayIds: Set<string>
): Pick<CitizenDashboardFilters, "scope_type" | "scope_id"> {
  if (input.scope_type === "barangay" && barangayIds.has(input.scope_id)) {
    return { scope_type: "barangay", scope_id: input.scope_id };
  }

  if (input.scope_type === "city" && cityIds.has(input.scope_id)) {
    return { scope_type: "city", scope_id: input.scope_id };
  }

  const fallbackCity = [...cityIds][0] ?? "";
  if (fallbackCity) {
    return { scope_type: "city", scope_id: fallbackCity };
  }

  const fallbackBarangay = [...barangayIds][0] ?? "";
  return { scope_type: "barangay", scope_id: fallbackBarangay };
}

function resolveFiscalYear(
  input: number,
  publishedAips: AipRow[],
  scope: Pick<CitizenDashboardFilters, "scope_type" | "scope_id">,
  barangayById: Map<string, BarangayRow>
): number {
  const availableYears = Array.from(
    new Set(
      publishedAips
        .filter((aip) => aipInScope(aip, scope.scope_type, scope.scope_id, barangayById))
        .map((aip) => aip.fiscal_year)
    )
  ).sort((a, b) => b - a);

  if (availableYears.includes(input)) {
    return input;
  }

  return availableYears[0] ?? new Date().getFullYear();
}

export function createMockCitizenDashboardRepo(): CitizenDashboardRepo {
  return {
    async getDashboard(filters: CitizenDashboardFilters): Promise<CitizenDashboardData> {
      const activeCities = CITIZEN_DASHBOARD_FIXTURE.cities
        .filter((city) => city.is_active)
        .sort((a, b) => a.name.localeCompare(b.name));

      const activeBarangays = CITIZEN_DASHBOARD_FIXTURE.barangays
        .filter((barangay) => barangay.is_active && barangay.city_id !== null)
        .sort((a, b) => a.name.localeCompare(b.name));

      const cityIds = new Set(activeCities.map((city) => city.id));
      const barangayIds = new Set(activeBarangays.map((barangay) => barangay.id));
      const barangayById = new Map(activeBarangays.map((barangay) => [barangay.id, barangay]));

      const scope = resolveScope(filters, cityIds, barangayIds);
      const search = filters.search.trim();

      const publishedAips = CITIZEN_DASHBOARD_FIXTURE.aips
        .filter((aip) => aip.status === "published")
        .sort(
          (a, b) =>
            toTimestamp(b.published_at) - toTimestamp(a.published_at) ||
            b.fiscal_year - a.fiscal_year
        );

      const fiscalYear = resolveFiscalYear(
        filters.fiscal_year,
        publishedAips,
        scope,
        barangayById
      );

      const publishedAipIds = new Set(publishedAips.map((aip) => aip.id));
      const projects = CITIZEN_DASHBOARD_FIXTURE.projects.filter((project) =>
        publishedAipIds.has(project.aip_id)
      );
      const aipReviews = CITIZEN_DASHBOARD_FIXTURE.aipReviews.filter((review) =>
        publishedAipIds.has(review.aip_id)
      );
      const uploadedFiles = CITIZEN_DASHBOARD_FIXTURE.uploadedFiles.filter(
        (file) => file.is_current && publishedAipIds.has(file.aip_id)
      );
      const publicStatusRows = CITIZEN_DASHBOARD_FIXTURE.publicStatusRows.filter((row) =>
        publishedAipIds.has(row.id)
      );

      return {
        resolvedFilters: {
          scope_type: scope.scope_type,
          scope_id: scope.scope_id,
          fiscal_year: fiscalYear,
          search,
        },
        activeCities,
        activeBarangays,
        sectors: [...CITIZEN_DASHBOARD_FIXTURE.sectors],
        publishedAips,
        projects,
        aipReviews,
        uploadedFiles,
        publicStatusRows,
      };
    },
  };
}

