import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardAip } from "@/features/dashboard/types/dashboard-types";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  under_review: "bg-blue-50 text-blue-700 border-blue-200",
  for_revision: "bg-orange-50 text-orange-700 border-orange-200",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function formatStatusLabel(status: string): string {
  return status.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export function AipsByYearTable({ rows }: { rows: DashboardAip[] }) {
  return (
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardHeader><CardTitle className="text-base">AIPs by Year</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_1fr] rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500"><span>Year</span><span>Status</span><span>Updated</span></div>
        {rows.slice(0, 8).map((aip) => (
          <div key={aip.id} className="grid grid-cols-[1fr_1fr_1fr] items-center rounded-md border border-slate-200 px-3 py-2 text-sm">
            <span className="font-medium text-slate-900">{aip.fiscalYear}</span>
            <Badge className={`w-fit border ${STATUS_STYLES[aip.status] ?? STATUS_STYLES.draft}`}>{formatStatusLabel(aip.status)}</Badge>
            <span className="text-slate-600">{formatDate(aip.statusUpdatedAt)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
