"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ConfirmNotificationSettingsModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Confirm Notification Settings Change</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-[13.5px] text-slate-700">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold">Medium Impact Change</div>
                <div>
                  You are about to change system-wide notification settings. This will affect
                  notification delivery for all administrators.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-xs text-slate-500">
            <div>This action will:</div>
            <ul className="list-disc pl-5">
              <li>Affect multiple users or system functions</li>
              <li>Be recorded in audit logs</li>
              <li>Take effect immediately</li>
            </ul>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-[11px] text-blue-700">
            Audit Logging: Your administrator identity, timestamp, and the nature of this change will be
            permanently recorded for compliance and security purposes.
          </div>

          <div className="text-xs text-slate-600">Are you sure you want to proceed with this change?</div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="bg-[#0E5D6F] text-white hover:bg-[#0E5D6F]/90" onClick={onConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

