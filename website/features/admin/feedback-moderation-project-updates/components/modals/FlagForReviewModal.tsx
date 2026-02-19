"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function FlagForReviewModal({
  open,
  onOpenChange,
  reason,
  onReasonChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
}) {
  const isValid = reason.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Flag for Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-[13.5px] text-slate-700">
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <div className="font-medium">Flag for Official Review</div>
              <div className="mt-2 text-sm">
                This content will be marked for official review. It will remain visible to the public until further action is taken. The flagging will alert appropriate officials to review this content for policy compliance.
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>
              Reason for Flag for Review <span className="text-rose-600">*</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Explain why this content requires official review..."
              className="min-h-[120px]"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            Audit Logging: All actions performed on this workflow case are automatically logged with timestamps, user information, and justification for compliance purposes.
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button className="w-56" disabled={!isValid} onClick={onConfirm}>
              Confirm Flag for Review
            </Button>
            <Button
              variant="outline"
              className="w-56"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
