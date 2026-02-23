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
