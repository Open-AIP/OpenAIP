import { getUser } from "@/lib/actions/auth.actions";
import { mapUserToActorContext } from "@/lib/domain/actor-context";
import { getAuditFeedForActor } from "@/lib/repos/audit/queries";
import { redirect } from "next/navigation";
import { parseDashboardQueryState, parseOptionalYear } from "@/features/dashboard/utils/dashboard-query";
import { getBarangayDashboardData } from "@/features/dashboard/hooks/use-barangay-dashboard-data";
import { BarangayDashboardPage } from "@/features/dashboard/views/barangay-dashboard-page";

type DashboardSearchParams = Promise<{
  year?: string;
  q?: string;
  tableQ?: string;
  category?: string;
  sector?: string;
  kpi?: string;
}>;

export async function BarangayDashboardView({ searchParams }: { searchParams: DashboardSearchParams }) {
  const user = await getUser().catch(() => {
    redirect("/barangay/sign-in");
  });

  if (!user) redirect("/barangay/sign-in");
  if (user.role !== "barangay_official" || !user.barangayId) {
    redirect("/barangay/unauthorized");
  }

  const params = await searchParams;
  const queryState = parseDashboardQueryState(params);
  const requestedFiscalYear = parseOptionalYear(params.year);

  const { data, vm } = await getBarangayDashboardData({
    barangayId: user.barangayId,
    requestedFiscalYear,
    queryState,
  });

  const actor = mapUserToActorContext(user);
  const recentActivityLogs = actor ? await getAuditFeedForActor(actor) : [];

  return (
    <BarangayDashboardPage
      data={data}
      vm={vm}
      queryState={queryState}
      recentActivityLogs={recentActivityLogs}
    />
  );
}
