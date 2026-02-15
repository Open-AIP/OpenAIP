"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import type { AuditEntryVM, FlaggedUserRowVM } from "@/lib/repos/usage-controls/types";

const statusBadgeClass = (status?: string | null) => {
  if (!status) return "bg-slate-50 text-slate-600 border-slate-200";
  if (status === "Hidden") return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "Blocked") return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "Visible") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
};

export default function UserAuditHistoryDialog({
  open,
  onOpenChange,
  user,
  entries,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: FlaggedUserRowVM | null;
  entries: AuditEntryVM[];
}) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Audit History</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-[13.5px] text-slate-700">
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{user.name}</div>
              <div className="text-xs text-slate-500">{user.accountType} Account</div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={statusBadgeClass(user.status)}>
                {user.status}
              </Badge>
              <div className="text-xs text-slate-500 mt-1">{user.flags} total flags</div>
              {user.status === "Blocked" && user.blockedUntil && (
                <div className="text-xs text-rose-600 mt-1">
                  Currently Blocked Until: {user.blockedUntil}
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-500">Showing {entries.length} audit entries</div>

          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900">{entry.title}</div>
                  {entry.status && (
                    <Badge variant="outline" className={statusBadgeClass(entry.status)}>
                      {entry.status}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-slate-500">{entry.timestamp}</div>
                <div className="mt-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Performed By:</span>{" "}
                  {entry.performedBy}
                </div>
                {entry.violationCategory && (
                  <div className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Violation Category:</span>{" "}
                    {entry.violationCategory}
                  </div>
                )}
                {entry.details && (
                  <div className="mt-1 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Moderation Feedback:</span>{" "}
                    {entry.details}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
            Audit Logging: All actions performed on this workflow case are automatically logged with
            timestamps, user information, and justification for compliance purposes.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
