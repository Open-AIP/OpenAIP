"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { UsageMetricsVM } from "@/lib/repos/admin-dashboard/types";
import { formatNumber } from "@/lib/formatting";

export default function MiniKpiStack({ metrics }: { metrics: UsageMetricsVM }) {
  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="text-xs text-slate-500">Avg. Daily Requests</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {formatNumber(Math.round(metrics.avgDailyRequests))}
          </div>
          <div className="text-[11px] text-emerald-600">{metrics.deltaLabels.avgDailyRequests}</div>
        </CardContent>
      </Card>
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="text-xs text-slate-500">Total Requests</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {formatNumber(metrics.totalRequests)}
          </div>
          <div className="text-[11px] text-emerald-600">{metrics.deltaLabels.totalRequests}</div>
        </CardContent>
      </Card>
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="text-xs text-slate-500">Error Rate</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {(metrics.errorRate * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-emerald-600">{metrics.deltaLabels.errorRate}</div>
        </CardContent>
      </Card>
    </div>
  );
}

