"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ConfirmPublishBannerModal({
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
          <DialogTitle>Confirm Publish Banner</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-[13.5px] text-slate-700">
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold">High Impact Action</div>
                <div>
                  System banners are visible to all users across the entire platform. Publishing or
                  disabling a banner requires confirmation and is audit-logged for compliance.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-[11px] text-blue-700">
            Audit Logging: Your administrator identity, timestamp, and the banner content will be
            permanently recorded for compliance and governance purposes.
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
              Confirm Publish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

