import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, ChevronDown, Heart, Search, TrendingUp } from "lucide-react";
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
    <Card className="bg-card text-card-foreground border border-border rounded-xl py-0">
      <CardHeader className="border-b border-border px-5 py-4">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Top Funded Projects
        </CardTitle>
      </CardHeader>
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
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="tableQ"
          defaultValue={queryState.tableQ}
          placeholder="Search projects..."
          className="h-9 rounded-lg border-0 bg-secondary pl-9 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      </div>
      <div className="relative">
        <select name="category" defaultValue={queryState.tableCategory} className="h-9 w-full appearance-none rounded-lg border-0 bg-secondary px-3 pr-8 text-sm text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
          <option value="all">All Categories</option>
          <option value="health">Health</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="other">Other</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      <div className="relative">
        <select name="sector" defaultValue={queryState.tableSector} className="h-9 w-full appearance-none rounded-lg border-0 bg-secondary px-3 pr-8 text-sm text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
          <option value="all">All Types</option>
          {sectors.map((sector) => (
            <option key={sector.code} value={sector.code}>{sector.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
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
  const resolveRawTypeLabel = (sectorCode: string): string => sectors.find((sector) => sector.code === sectorCode)?.label ?? sectorCode;
  const resolveTypeLabel = (project: DashboardProject): "Infrastructure" | "Health" | "Others" => {
    const raw = resolveRawTypeLabel(project.sectorCode).toLowerCase();
    if (raw.includes("health") || project.category === "health") return "Health";
    if (raw.includes("infra") || project.category === "infrastructure") return "Infrastructure";
    return "Others";
  };
  const isHealthType = (typeLabel: string): boolean => /health/i.test(typeLabel);
  const resolveCategoryLabel = (project: DashboardProject): "Economic" | "Social" | "General" | "Other" => {
    const sectorLabel = resolveRawTypeLabel(project.sectorCode).toLowerCase();
    if (sectorLabel.includes("economic")) return "Economic";
    if (sectorLabel.includes("social") || project.category === "health") return "Social";
    if (sectorLabel.includes("general") || project.category === "infrastructure") return "General";
    return "Other";
  };

  return (
    <div className="max-h-[353.8px] overflow-auto rounded-xl border border-border">
      <table className="w-full min-w-[780px] text-sm text-foreground">
        <thead className="sticky top-0 z-10 bg-secondary text-left text-xs font-medium text-muted-foreground">
          <tr>
            <th className="px-3 py-2">#</th><th className="px-3 py-2">Project Name</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Budget</th><th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((project, index) => (
            <tr key={project.id} className="border-b border-border text-sm hover:bg-accent">
              <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
              <td className="px-3 py-2"><div className="max-w-[300px] truncate">{project.programProjectDescription}</div></td>
              <td className="px-3 py-2">
                {(() => {
                  const category = resolveCategoryLabel(project);
                  const categoryClass =
                    category === "Economic"
                      ? "bg-mediumseagreen-200 text-mediumseagreen-100"
                      : category === "Social"
                        ? "bg-dodgerblue-200 text-dodgerblue-100"
                        : category === "General"
                          ? "bg-darkslategray-200 text-darkslategray-100"
                          : "bg-secondary text-foreground";

                  return (
                    <Badge className={`rounded-md border border-transparent text-xs font-medium ${categoryClass}`}>
                      {category}
                    </Badge>
                  );
                })()}
              </td>
              <td className="px-3 py-2">
                <Badge className="rounded-md border border-border bg-card text-xs text-muted-foreground">
                  {isHealthType(resolveTypeLabel(project)) ? <Heart className="mr-1 h-3 w-3" /> : <Building2 className="mr-1 h-3 w-3" />}
                  {resolveTypeLabel(project)}
                </Badge>
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">{toCurrency(project.total ?? 0)}</td>
              <td className="px-3 py-2">
                {hasProjectErrors(project.errors) ? (
                  <Badge className="rounded-md border border-border bg-card text-muted-foreground">Flagged</Badge>
                ) : project.isHumanEdited ? (
                  <Badge className="rounded-md border border-border bg-card text-muted-foreground">In Progress</Badge>
                ) : (
                  <Badge className="rounded-md border border-border bg-card text-muted-foreground">Planned</Badge>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No projects match your filters.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
