"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock } from "lucide-react";
import type { ReviewBacklogVM } from "@/lib/repos/admin-dashboard/types";

export default function ReviewBacklogCard({
  backlog,
  onViewAips,
}: {
  backlog: ReviewBacklogVM;
  onViewAips: () => void;
}) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-[15px]">Review Backlog</CardTitle>
        <div className="text-[12px] text-slate-500">Aging analysis for pending reviews</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-[12px] text-blue-900">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold">{backlog.awaitingCount} items</div>
              <div className="text-[11px] text-blue-700">Awaiting Review</div>
              <div className="text-[11px] text-blue-700">Oldest: {backlog.awaitingOldestDays} days</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold">{backlog.stuckCount} items</div>
              <div className="text-[11px] text-amber-700">Stuck / Long-running</div>
              <div className="text-[11px] text-amber-700">
                &gt; {backlog.stuckOlderThanDays} days
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Note: Stuck/Long-running items are derived from Current Status Duration exceeding {backlog.stuckOlderThanDays} days.
        </div>

        <Button className="w-full bg-[#0E5D6F] text-white hover:bg-[#0E5D6F]/90" onClick={onViewAips}>
          View AIPs
        </Button>
      </CardContent>
    </Card>
  );
}

