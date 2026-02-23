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
    <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm">
      <CardHeader className="border-b border-gray-200 px-5 py-4"><CardTitle className="text-sm font-medium text-slate-700">Top Funded Projects</CardTitle></CardHeader>
      <CardContent className="p-5 space-y-4">
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
    <form method="get" className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <input type="hidden" name="q" value={queryState.q} />
      <input type="hidden" name="year" value={selectedFiscalYear} />
      <input type="hidden" name="kpi" value={queryState.kpiMode} />
      <Input name="tableQ" defaultValue={queryState.tableQ} placeholder="Search projects..." />
      <select name="category" defaultValue={queryState.tableCategory} className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm">
        <option value="all">All Categories</option>
        <option value="health">Health</option>
        <option value="infrastructure">Infrastructure</option>
        <option value="other">Other</option>
      </select>
      <select name="sector" defaultValue={queryState.tableSector} className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm">
        <option value="all">All Sectors</option>
        {sectors.map((sector) => (
          <option key={sector.code} value={sector.code}>{sector.label}</option>
        ))}
      </select>
      <Button type="submit" variant="outline" className="sr-only">Filter</Button>
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
    <div className="overflow-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[780px] text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium text-slate-600">
          <tr>
            <th className="px-3 py-2">#</th><th className="px-3 py-2">Project Name</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Budget</th><th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((project, index) => (
            <tr key={project.id} className="border-t border-gray-200 text-sm text-slate-700">
              <td className="px-3 py-2 text-slate-500">{index + 1}</td>
              <td className="px-3 py-2"><div className="max-w-[280px] truncate">{project.programProjectDescription}</div></td>
              <td className="px-3 py-2"><Badge variant="secondary" className="text-xs capitalize">{project.category}</Badge></td>
              <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{sectors.find((sector) => sector.code === project.sectorCode)?.label ?? project.sectorCode}</Badge></td>
              <td className="px-3 py-2 text-right font-semibold text-slate-800">{toCurrency(project.total ?? 0)}</td>
              <td className="px-3 py-2">
                {hasProjectErrors(project.errors) ? (
                  <Badge variant="outline">Flagged</Badge>
                ) : project.isHumanEdited ? (
                  <Badge variant="outline">Edited</Badge>
                ) : (
                  <Badge variant="outline">OK</Badge>
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
