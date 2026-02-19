"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ConfirmSecuritySettingsModal({
  open,
  onOpenChange,
  onConfirm,
  confirmDisabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Confirm Security Settings Change</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-[13.5px] text-slate-700">
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold">High Impact Change</div>
                <div>
                  You are about to change system-wide security settings. This will affect all users and
                  may require them to update their passwords or re-authenticate.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-xs text-slate-500">
            <div>This action will:</div>
            <ul className="list-disc pl-5">
              <li>Affect all system users immediately</li>
              <li>Be permanently recorded in audit logs</li>
              <li>Cannot be automatically reversed</li>
              <li>May require users to take action</li>
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
            <Button
              className="bg-[#0E5D6F] text-white hover:bg-[#0E5D6F]/90"
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

