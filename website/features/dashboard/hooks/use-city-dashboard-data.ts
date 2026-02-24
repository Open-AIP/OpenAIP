import { getDashboardDataByScope } from "@/lib/repo/dashboard-repo";
import { buildDashboardVm } from "@/features/dashboard/utils/dashboard-selectors";
import type { DashboardQueryState } from "@/features/dashboard/types/dashboard-types";
import { getDashboardSource } from "@/features/dashboard/hooks/dashboard-source";

export async function getCityDashboardData(input: {
  cityId: string;
  requestedFiscalYear?: number | null;
  queryState: DashboardQueryState;
}) {
  const source = getDashboardSource();
  const data = source.useMock
    ? source.cityMock
    : await getDashboardDataByScope({
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
