import Link from "next/link";
import { Building2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/formatting";
import { formatDaysSince } from "../utils";

type AipStatusSectionProps = {
  scopeLabel: string;
  scopeTypeLabel: "City" | "Barangay";
  fiscalYear: number;
  latestPublishedAt: string | null;
  aipParams: string;
};

export default function AipStatusSection({
  scopeLabel,
  scopeTypeLabel,
  fiscalYear,
  latestPublishedAt,
  aipParams,
}: AipStatusSectionProps) {
  return (
    <Card className="border-slate-200 shadow-lg">
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-b from-[#3292cf] to-[#0f5d8e] text-white shadow-md">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-4xl font-semibold tracking-tight text-[#0b5188] md:text-5xl">{scopeLabel}</h3>
              <div className="mt-2 flex items-center gap-2">
                <Badge className="bg-[#0f5d8e]">{scopeTypeLabel}</Badge>
                <Badge variant="outline">FY {fiscalYear}</Badge>
              </div>
            </div>
          </div>
          <div className="rounded-md border-l-4 border-[#0f5d8e] bg-[#eaf1f9] p-4 text-sm text-slate-700">
            <p className="font-semibold text-[#0b5188]">Data shown reflects published AIP records for the selected year.</p>
            <p className="mt-1">Information is updated as new documents are processed and published by the responsible offices.</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-2xl font-semibold text-slate-900">Status at a Glance</h4>
          <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs text-slate-600">Current Status</p>
            <Badge className="bg-emerald-600">Published</Badge>
          </div>
          <div className="space-y-1 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs text-slate-600">Publication Date</p>
            <p className="text-sm font-semibold text-slate-900">
              {latestPublishedAt ? formatDate(latestPublishedAt) : "No published AIP yet"}
            </p>
          </div>
          <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-600">Last Updated</p>
            <p className="text-sm font-semibold text-slate-900">
              {latestPublishedAt ? formatDate(latestPublishedAt) : "No update yet"}
            </p>
          </div>
          <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-600">Duration in Current Stage</p>
            <p className="text-sm font-semibold text-slate-900">
              Published - {formatDaysSince(latestPublishedAt)}
            </p>
          </div>
          <Button asChild className="w-full rounded-xl bg-[#0b5188] hover:bg-[#0a416d]">
            <Link href={aipParams ? `/aips?${aipParams}` : "/aips"}>
              <FileText className="mr-2 h-4 w-4" />
              View AIP
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
