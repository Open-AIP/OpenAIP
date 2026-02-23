import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const STATUS_PIE_COLORS: Record<string, string> = {
  pending_review: "#EAB308",
  under_review: "#3B82F6",
  for_revision: "#F97316",
  published: "#22C55E",
  draft: "#94A3B8",
};

export function AipCoverageCard({ selectedAip }: { selectedAip: DashboardAip | null }) {
  return (
    <Card className="bg-white border border-gray-200 rounded-xl border-l-4 border-l-amber-500 py-0 shadow-sm">
      <CardHeader className="p-5 pb-0"><CardTitle className="text-sm font-medium text-slate-700">AIP Coverage</CardTitle></CardHeader>
      <CardContent className="p-5">
        {selectedAip ? (
          <div className="space-y-2 text-sm">
            <div className="text-slate-600">FY {selectedAip.fiscalYear}</div>
            <Badge className={`w-fit border ${STATUS_STYLES[selectedAip.status] ?? STATUS_STYLES.draft}`}>{formatStatusLabel(selectedAip.status)}</Badge>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500">Missing AIP</div>
              <div className="text-sm font-semibold text-slate-700">No AIP uploaded for selected year.</div>
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-transparent w-fit">Action Needed</Badge>
            <Button className="w-full bg-slate-800 text-white hover:bg-slate-800/90 rounded-lg" size="sm">Upload City AIP</Button>
          </div>
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
    <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm">
      <CardHeader className="p-5 pb-0"><CardTitle className="text-sm font-medium text-slate-700">Publication Timeline</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-sm text-slate-500 space-y-3">
          {years.map((item) => (
            <div key={item.year} className="grid grid-cols-[56px_1fr_24px] items-center gap-2 text-sm">
              <span className="text-slate-600">{item.year}</span>
              <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-emerald-500" style={{ width: tinyBarWidth(item.count, max) }} /></div>
              <span className="text-slate-700">{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export function AipsByYearTable({ rows }: { rows: DashboardAip[] }) {
  return (
    <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm">
      <CardHeader className="p-5 pb-0"><CardTitle className="text-sm font-medium text-slate-700">AIPs by Year</CardTitle></CardHeader>
      <CardContent className="p-5 space-y-2">
        <div className="grid grid-cols-[72px_140px_1fr_120px_auto] rounded-md border border-gray-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600"><span>Year</span><span>Status</span><span>Uploaded By</span><span>Upload Date</span><span className="text-right">Action</span></div>
        {rows.slice(0, 8).map((aip) => (
          <div key={aip.id} className="grid grid-cols-[72px_140px_1fr_120px_auto] items-center border-t border-gray-200 px-3 py-2 text-sm text-slate-700">
            <span className="font-medium text-slate-900">{aip.fiscalYear}</span>
            <Badge variant={aip.status === "published" ? "secondary" : "outline"} className={aip.status === "published" ? "" : `w-fit border ${STATUS_STYLES[aip.status] ?? STATUS_STYLES.draft}`}>{formatStatusLabel(aip.status)}</Badge>
            <span className="text-slate-600">{(aip as DashboardAip & { uploadedBy?: string }).uploadedBy ?? "System User"}</span>
            <span className="text-slate-600">{formatDate((aip as DashboardAip & { uploadedDate?: string }).uploadedDate ?? aip.statusUpdatedAt)}</span>
            <Button size="sm" variant="ghost" className="justify-self-end text-slate-600">View</Button>
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
  const agingAxisMax = Math.max(2, maxAgingCount);

  return (
    <div className="space-y-4">
      <StatusDistributionCard statusDistribution={statusDistribution} />

      <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm">
        <CardHeader className="p-5 pb-0"><CardTitle className="text-sm font-medium text-slate-700">Pending Review Aging</CardTitle></CardHeader>
        <CardContent className="p-5 text-sm">
          <div className="border border-dashed border-gray-300 rounded-lg p-3 space-y-2">
            {pendingReviewAging.map((item) => (
              <div key={item.bucket} className="grid grid-cols-[44px_1fr] items-center gap-2">
                <span className="text-slate-500 leading-tight">
                  {item.bucket}
                  <br />
                  days
                </span>
                <div className="h-7 rounded-sm bg-slate-50">
                  <div className="h-7 rounded-sm bg-[#0B6477]" style={{ width: `${Math.max(0, Math.min(100, (item.count / agingAxisMax) * 100))}%` }} />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-5 text-xs text-slate-500 pt-1">
              <span className="text-left">0</span>
              <span className="text-center">{(agingAxisMax * 0.25).toFixed(1)}</span>
              <span className="text-center">{(agingAxisMax * 0.5).toFixed(0)}</span>
              <span className="text-center">{(agingAxisMax * 0.75).toFixed(1)}</span>
              <span className="text-right">{agingAxisMax}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StatusDistributionCard({
  statusDistribution,
}: {
  statusDistribution: Array<{ status: string; count: number }>;
}) {
  const totalStatusCount = statusDistribution.reduce((sum, item) => sum + item.count, 0);
  const pieStops = statusDistribution.reduce(
    (acc, item) => {
      if (item.count <= 0) return acc;
      const start = acc.cursor;
      const slice = totalStatusCount > 0 ? (item.count / totalStatusCount) * 100 : 0;
      const end = start + slice;
      acc.parts.push(`${STATUS_PIE_COLORS[item.status] ?? "#94A3B8"} ${start}% ${end}%`);
      acc.cursor = end;
      return acc;
    },
    { parts: [] as string[], cursor: 0 }
  );
  const pieBackground = pieStops.parts.length > 0 ? `conic-gradient(${pieStops.parts.join(", ")})` : "conic-gradient(#e2e8f0 0 100%)";
  const labelPositionByStatus: Record<string, string> = {
    pending_review: "top-[-20px] left-1/2 -translate-x-1/2 text-center",
    under_review: "left-[-86px] top-[120px] text-left",
    for_revision: "right-[-80px] top-[122px] text-left",
    published: "right-[-76px] top-[74px] text-left",
    draft: "left-[-74px] top-[74px] text-left",
  };

  return (
    <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm">
      <CardHeader className="p-5 pb-0"><CardTitle className="text-sm font-medium text-slate-700">Status Distribution</CardTitle></CardHeader>
      <CardContent className="p-5 space-y-2 text-sm">
        <div className="flex justify-center">
          <div className="relative h-44 w-44 rounded-full" style={{ background: pieBackground }}>
            {statusDistribution
              .filter((item) => item.count > 0)
              .map((item) => {
                const percentage = totalStatusCount > 0 ? Math.round((item.count / totalStatusCount) * 100) : 0;
                return (
                  <div
                    key={item.status}
                    className={`absolute text-xs leading-tight ${labelPositionByStatus[item.status] ?? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"}`}
                    style={{ color: STATUS_PIE_COLORS[item.status] ?? "#64748B" }}
                  >
                    {formatStatusLabel(item.status)}:
                    <br />
                    {percentage}%
                  </div>
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
