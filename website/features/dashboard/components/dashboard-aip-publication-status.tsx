import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardAip } from "@/features/dashboard/types/dashboard-types";

function formatStatusLabel(status: string): string {
  return status.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  under_review: "bg-blue-50 text-blue-700 border-blue-200",
  for_revision: "bg-orange-50 text-orange-700 border-orange-200",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function AipCoverageCard({ selectedAip }: { selectedAip: DashboardAip | null }) {
  return (
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardHeader><CardTitle className="text-base">AIP Coverage</CardTitle></CardHeader>
      <CardContent>
        {selectedAip ? (
          <div className="space-y-2 text-sm">
            <div className="text-slate-600">FY {selectedAip.fiscalYear}</div>
            <Badge className={`w-fit border ${STATUS_STYLES[selectedAip.status] ?? STATUS_STYLES.draft}`}>{formatStatusLabel(selectedAip.status)}</Badge>
          </div>
        ) : (
          <div className="text-sm text-slate-500">No AIP uploaded for selected year.</div>
        )}
      </CardContent>
    </Card>
  );
}

function tinyBarWidth(value: number, max: number): string {
  if (max <= 0) return "0%";
  return `${Math.max(8, Math.round((value / max) * 100))}%`;
}

export function PublicationTimelineCard({ years }: { years: Array<{ year: number; count: number }> }) {
  const max = Math.max(1, ...years.map((item) => item.count));
  return (
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardHeader><CardTitle className="text-base">Publication Timeline</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {years.map((item) => (
          <div key={item.year} className="grid grid-cols-[56px_1fr_24px] items-center gap-2 text-sm">
            <span className="text-slate-600">{item.year}</span>
            <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-emerald-500" style={{ width: tinyBarWidth(item.count, max) }} /></div>
            <span className="text-slate-700">{item.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
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

export function AipStatusColumn({
  statusDistribution,
  pendingReviewAging,
}: {
  statusDistribution: Array<{ status: string; count: number }>;
  pendingReviewAging: Array<{ bucket: string; count: number }>;
}) {
  const maxAgingCount = Math.max(1, ...pendingReviewAging.map((bucket) => bucket.count));

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 py-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base">Status Distribution</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {statusDistribution.map((item) => (
            <div key={item.status} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
              <span className="capitalize text-slate-600">{formatStatusLabel(item.status)}</span>
              <span className="font-medium text-slate-900">{item.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200 py-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base">Pending Review Aging</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {pendingReviewAging.map((item) => (
            <div key={item.bucket} className="grid grid-cols-[56px_1fr_24px] items-center gap-2">
              <span className="text-slate-500">{item.bucket}</span>
              <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-[#0B6477]" style={{ width: tinyBarWidth(item.count, maxAgingCount) }} /></div>
              <span className="text-slate-700">{item.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
