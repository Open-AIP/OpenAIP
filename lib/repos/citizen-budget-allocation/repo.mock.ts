import type { AipRow, BarangayRow, ProjectRow, SectorRow } from "@/lib/contracts/databasev2";
import { CITIZEN_DASHBOARD_FIXTURE } from "@/mocks/fixtures/citizen/citizen-dashboard.fixture";
import { canPublicReadAip } from "@/lib/repos/_shared/visibility";
import type { BudgetAllocationData, BudgetAllocationFilters, CitizenBudgetAllocationRepo } from "./types";

function toTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const stamp = new Date(value).getTime();
  return Number.isNaN(stamp) ? 0 : stamp;
}

function aipInScope(
  aip: AipRow,
  scopeType: BudgetAllocationFilters["scope_type"],
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
  input: BudgetAllocationFilters,
  cityIds: Set<string>,
  barangayIds: Set<string>
): Pick<BudgetAllocationFilters, "scope_type" | "scope_id"> {
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
  scope: Pick<BudgetAllocationFilters, "scope_type" | "scope_id">,
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

export function createMockCitizenBudgetAllocationRepo(): CitizenBudgetAllocationRepo {
  return {
    async getBudgetAllocation(filters: BudgetAllocationFilters): Promise<BudgetAllocationData> {
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

      const sectors: SectorRow[] = CITIZEN_DASHBOARD_FIXTURE.sectors;

      const publishedAips = CITIZEN_DASHBOARD_FIXTURE.aips
        .filter((aip) => canPublicReadAip({ status: aip.status }))
        .sort(
          (a, b) =>
            toTimestamp(b.published_at) - toTimestamp(a.published_at) ||
            b.fiscal_year - a.fiscal_year
        );

      const fiscalYear = resolveFiscalYear(filters.fiscal_year, publishedAips, scope, barangayById);

      const publishedAipIds = new Set(publishedAips.map((aip) => aip.id));
      const projects: ProjectRow[] = CITIZEN_DASHBOARD_FIXTURE.projects.filter((project) =>
        publishedAipIds.has(project.aip_id)
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
        sectors,
        publishedAips,
        projects,
      };
    },
  };
}
