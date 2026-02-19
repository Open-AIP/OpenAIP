"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Lock,
  User,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { RecentActivityItemVM } from "@/lib/repos/admin-dashboard/types";
import { formatDate } from "@/lib/formatting";
import { ADMIN_ACTIVITY_TONE_STYLES } from "@/lib/ui/status";

const iconMap = {
  comment: MessageSquare,
  lock: Lock,
  user: User,
  check: CheckCircle2,
  alert: AlertTriangle,
};

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  return `${formatDate(date)} · ${date.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export default function RecentActivityList({
  items,
  onViewAudit,
}: {
  items: RecentActivityItemVM[];
  onViewAudit: () => void;
}) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-[15px]">Recent Activity</CardTitle>
        <div className="text-[12px] text-slate-500">Audit-based activity feed (read-only).</div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const Icon = iconMap[item.iconKey];
          return (
            <div
              key={item.id}
              className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="text-[13px] font-semibold text-slate-900">{item.title}</div>
                  <Badge className={`border ${ADMIN_ACTIVITY_TONE_STYLES[item.tagTone]}`}>{item.tagLabel}</Badge>
                </div>
                <div className="text-[12px] text-slate-600">{item.reference}</div>
                <div className="text-[11px] text-slate-500">
                  {formatDateTime(item.timestamp)} · Performed by {item.performedBy}
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex justify-end">
          <Button variant="outline" className="text-[12px]" onClick={onViewAudit}>
            View Audit Trail
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

