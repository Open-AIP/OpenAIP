"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

export type WorkflowActionType = "forceUnclaim" | "cancel" | "archive" | "unarchive";

const ACTION_COPY: Record<
  WorkflowActionType,
  { title: string; tone: "warning" | "danger"; message: string }
> = {
  forceUnclaim: {
    title: "Force-Unclaim Workflow",
    tone: "warning",
    message:
      "This will remove the current assignee and return the workflow to the unclaimed queue.",
  },
  cancel: {
    title: "Cancel Submission",
    tone: "danger",
    message:
      "This will cancel the current submission workflow. This action cannot be undone.",
  },
  archive: {
    title: "Archive Submission",
    tone: "danger",
    message:
      "This will archive the submission and remove it from active workflow queues.",
  },
  unarchive: {
    title: "Unarchive Submission",
    tone: "warning",
    message:
      "This will restore the submission back to the active workflow queue.",
  },
};

export default function WorkflowActionModal({
  open,
  onOpenChange,
  actionType,
  targetLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: WorkflowActionType;
  targetLabel: string;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  const config = ACTION_COPY[actionType];
  const trimmedReason = reason.trim();
  const isValid = trimmedReason.length >= 10;

  const calloutClass = useMemo(() => {
    if (config.tone === "danger") {
      return "border-rose-200 bg-rose-50 text-rose-900";
    }
    return "border-amber-200 bg-amber-50 text-amber-900";
  }, [config.tone]);

  const actionVariant = config.tone === "danger" ? "destructive" : "default";

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setReason("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold">{config.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-[13.5px] text-slate-700">
          <div className={`flex gap-3 rounded-lg border p-3 ${calloutClass}`}>
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <p>{config.message}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-[13.5px] font-medium text-slate-700">Target AIP</Label>
            <Input
              readOnly
              value={targetLabel}
              className="h-11 border-slate-200 bg-slate-50 text-[13.5px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13.5px] font-medium text-slate-700">
              Justification / Reason *
            </Label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-[120px] border-slate-200 text-[13.5px]"
              placeholder="Provide your justification..."
            />
            <p className="text-[12px] text-slate-500">
              Required for audit compliance. Minimum 10 characters.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-600">
            All actions performed in this workflow are logged for audit and compliance review.
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant={actionVariant}
              disabled={!isValid}
              onClick={() => {
                if (!isValid) return;
                onConfirm(trimmedReason);
                onOpenChange(false);
              }}
            >
              Confirm Action
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
