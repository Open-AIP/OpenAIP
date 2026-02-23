import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardQueryState, DashboardSector, DashboardProject } from "@/features/dashboard/types/dashboard-types";
import { TopProjectsFilters } from "@/features/dashboard/components/top-projects-filters";
import { TopProjectsTable } from "@/features/dashboard/components/top-projects-table";

export function TopFundedProjectsSection({
  queryState,
  selectedFiscalYear,
  sectors,
  rows,
}: {
  queryState: DashboardQueryState;
  selectedFiscalYear: number;
  sectors: DashboardSector[];
  rows: DashboardProject[];
}) {
  return (
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-lg">Top Funded Projects</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <TopProjectsFilters queryState={queryState} selectedFiscalYear={selectedFiscalYear} sectors={sectors} />
        <TopProjectsTable rows={rows} sectors={sectors} />
      </CardContent>
    </Card>
  );
}
