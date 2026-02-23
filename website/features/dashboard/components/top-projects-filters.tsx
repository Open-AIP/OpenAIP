import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DashboardQueryState, DashboardSector } from "@/features/dashboard/types/dashboard-types";

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
