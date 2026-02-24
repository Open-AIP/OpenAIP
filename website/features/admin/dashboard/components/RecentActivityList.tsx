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
    <Card className="border-slate-200 py-0 shadow-none">
      <CardHeader className="space-y-1 pb-0">
        <CardTitle className="text-[18px]">Recent Activity</CardTitle>
        <div className="text-[12px] text-slate-500">Audit-based activity feed (read-only).</div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3 max-h-125 overflow-y-auto pr-1">
          {items.map((item) => {
            const Icon = iconMap[item.iconKey];
            return (
              <div
                key={item.id}
                className="flex gap-3 rounded-[10px] border border-slate-200 bg-white p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-slate-50 text-slate-500">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="text-[13px] font-semibold text-slate-900">{item.title}</div>
                    <Badge className={`border text-[11px] ${ADMIN_ACTIVITY_TONE_STYLES[item.tagTone]}`}>
                      {item.tagLabel}
                    </Badge>
                  </div>
                  <div className="text-[12px] text-slate-600">{item.reference}</div>
                  <div className="text-[11px] text-slate-500">
                    {formatDateTime(item.timestamp)} · Performed by {item.performedBy}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
          <Button variant="outline" className="h-9.5 border-slate-300 text-[13px]" onClick={onViewAudit}>
            View Audit Trail
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

