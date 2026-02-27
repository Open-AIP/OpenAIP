import { getUser } from "@/lib/actions/auth.actions";
import { mapUserToActorContext } from "@/lib/domain/actor-context";
import { getAuditFeedForActor } from "@/lib/repos/audit/queries";
import { redirect } from "next/navigation";
import { parseDashboardQueryState, parseOptionalYear } from "@/features/dashboard/utils/dashboard-query";
import { getCityDashboardData } from "@/features/dashboard/hooks/use-city-dashboard-data";
import { CityDashboardPage } from "@/features/dashboard/views/city-dashboard-page";

type DashboardSearchParams = Promise<{
  year?: string;
  q?: string;
  tableQ?: string;
  category?: string;
  sector?: string;
  kpi?: string;
}>;

export async function CityDashboardView({ searchParams }: { searchParams: DashboardSearchParams }) {
  const user = await getUser().catch(() => {
    redirect("/city/sign-in");
  });

  if (!user) redirect("/city/sign-in");
  if (user.role !== "city_official" || !user.cityId) {
    redirect("/city/unauthorized");
  }

  const params = await searchParams;
  const queryState = parseDashboardQueryState(params);
  const requestedFiscalYear = parseOptionalYear(params.year);

  const { data, vm } = await getCityDashboardData({
    cityId: user.cityId,
    requestedFiscalYear,
    queryState,
  });

  const actor = mapUserToActorContext(user);
  const recentActivityLogs = actor ? await getAuditFeedForActor(actor) : [];

  return (
    <CityDashboardPage
      data={data}
      vm={vm}
      queryState={queryState}
      recentActivityLogs={recentActivityLogs}
    />
  );
}
