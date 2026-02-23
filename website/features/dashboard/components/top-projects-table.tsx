import { Badge } from "@/components/ui/badge";
import type { DashboardProject, DashboardSector } from "@/features/dashboard/types/dashboard-types";
import { hasProjectErrors } from "@/features/dashboard/utils/dashboard-selectors";

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
