import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DashboardQueryState, DashboardSector, DashboardProject } from "@/features/dashboard/types/dashboard-types";
import { hasProjectErrors } from "@/features/dashboard/utils/dashboard-selectors";

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

export function TopProjectsFilters({
  queryState,
  selectedFiscalYear,
  sectors,
}: {
  queryState: DashboardQueryState;
  selectedFiscalYear: number;
  sectors: DashboardSector[];
}) {
  return (
    <form method="get" className="grid gap-2 md:grid-cols-[1fr_160px_160px_auto]">
      <input type="hidden" name="q" value={queryState.q} />
      <input type="hidden" name="year" value={selectedFiscalYear} />
      <input type="hidden" name="kpi" value={queryState.kpiMode} />
      <Input name="tableQ" defaultValue={queryState.tableQ} placeholder="Search projects..." />
      <select name="category" defaultValue={queryState.tableCategory} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
        <option value="all">All Categories</option>
        <option value="health">Health</option>
        <option value="infrastructure">Infrastructure</option>
        <option value="other">Other</option>
      </select>
      <select name="sector" defaultValue={queryState.tableSector} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
        <option value="all">All Sectors</option>
        {sectors.map((sector) => (
          <option key={sector.code} value={sector.code}>{sector.label}</option>
        ))}
      </select>
      <Button type="submit" variant="outline">Filter</Button>
    </form>
  );
}

function toCurrency(value: number): string {
  return value.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
}

export function TopProjectsTable({
  rows,
  sectors,
}: {
  rows: DashboardProject[];
  sectors: DashboardSector[];
}) {
  return (
    <div className="overflow-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[780px] text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2">#</th><th className="px-3 py-2">Project Name</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Budget</th><th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((project, index) => (
            <tr key={project.id} className="border-t border-slate-100">
              <td className="px-3 py-2 text-slate-500">{index + 1}</td>
              <td className="px-3 py-2"><div className="max-w-[280px] truncate">{project.programProjectDescription}</div></td>
              <td className="px-3 py-2"><Badge variant="outline" className="text-xs capitalize">{project.category}</Badge></td>
              <td className="px-3 py-2 text-slate-600">{sectors.find((sector) => sector.code === project.sectorCode)?.label ?? project.sectorCode}</td>
              <td className="px-3 py-2 font-medium text-slate-900">{toCurrency(project.total ?? 0)}</td>
              <td className="px-3 py-2">
                {hasProjectErrors(project.errors) ? (
                  <Badge className="border border-rose-200 bg-rose-50 text-rose-700">Flagged</Badge>
                ) : project.isHumanEdited ? (
                  <Badge className="border border-blue-200 bg-blue-50 text-blue-700">Edited</Badge>
                ) : (
                  <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">OK</Badge>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">No projects match your filters.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
