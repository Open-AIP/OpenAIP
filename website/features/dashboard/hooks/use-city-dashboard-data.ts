import { getDashboardRepo } from "@/lib/repos/dashboard/repo.server";
import { buildDashboardVm } from "@/features/dashboard/utils/dashboard-selectors";
import type { DashboardQueryState } from "@/features/dashboard/types/dashboard-types";

export async function getCityDashboardData(input: {
  cityId: string;
  requestedFiscalYear?: number | null;
  queryState: DashboardQueryState;
}) {
  const repo = getDashboardRepo();
  const data = await repo.getDashboardDataByScope({
    scope: "city",
    scopeId: input.cityId,
    requestedFiscalYear: input.requestedFiscalYear,
  });

  const vm = buildDashboardVm({
    data,
    query: input.queryState.q,
    tableQuery: input.queryState.tableQ,
    tableCategory: input.queryState.tableCategory,
    tableSector: input.queryState.tableSector,
  });

  return { data, vm };
}

export const useCityDashboardData = getCityDashboardData;
