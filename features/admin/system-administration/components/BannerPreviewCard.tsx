"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor } from "lucide-react";
import type { SystemBannerDraft } from "@/lib/repos/system-administration/types";
import { cn } from "@/ui/utils";

const severityStyles: Record<SystemBannerDraft["severity"], string> = {
  Info: "bg-blue-50 text-blue-700 border-blue-200",
  Warning: "bg-amber-50 text-amber-700 border-amber-200",
  Critical: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function BannerPreviewCard({ draft }: { draft: SystemBannerDraft }) {
  const durationLabel =
    draft.startAt && draft.endAt
      ? `Scheduled (${draft.startAt} to ${draft.endAt})`
      : "Manual control (no schedule)";

  return (
    <Card className="border-slate-200">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Monitor className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-[15px]">Banner Preview</CardTitle>
            <div className="text-[12px] text-slate-500">How the banner will appear</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-500">System-Wide Display Preview</div>
          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Badge className={cn("border", severityStyles[draft.severity])}>
                {draft.severity}
              </Badge>
              <span className="text-[13.5px] font-semibold text-slate-900">
                {draft.title || "System Banner"}
              </span>
            </div>
            <p className="mt-2 text-[12px] text-slate-600">
              {draft.message || "Banner message will appear here once provided."}
            </p>
          </div>
        </div>

        <div className="space-y-1 text-[12px] text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">Banner Details:</span>
          </div>
          <div>Severity: {draft.severity}</div>
          <div>Visibility: All users system-wide</div>
          <div>Duration: {durationLabel}</div>
        </div>
      </CardContent>
    </Card>
  );
}

