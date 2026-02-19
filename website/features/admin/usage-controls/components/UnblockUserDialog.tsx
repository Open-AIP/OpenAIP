"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck } from "lucide-react";
import type { FlaggedUserRowVM } from "@/lib/repos/usage-controls/types";

export default function UnblockUserDialog({
  open,
  onOpenChange,
  user,
  reason,
  onReasonChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: FlaggedUserRowVM | null;
  reason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
}) {
  if (!user) return null;

  const confirmDisabled = reason.trim().length < 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Unblock Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-[13.5px] text-slate-700">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div>Restore Account Access</div>
                <div>The user will regain full access to the system.</div>
                <div>This action is audit-logged with your identity and justification.</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 text-xs">
            <div className="font-medium text-slate-900">{user.name}</div>
            <div className="text-slate-500">
              {user.accountType} · Flagged {user.flags} times
            </div>
            <div className="text-slate-500">Last Flag: {user.reasonSummary}</div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700">Reason for Unblock *</div>
            <Textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Explain why this account needs to be unblocked..."
            />
          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
            Audit Logging: All actions performed on this workflow case are automatically logged with
            timestamps, user information, and justification for compliance purposes.
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0E5D6F] text-white hover:bg-[#0E5D6F]/90"
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              Confirm Unblock Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
