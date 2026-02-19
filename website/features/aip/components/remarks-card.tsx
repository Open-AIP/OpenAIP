"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, RotateCw, TriangleAlert, X } from "lucide-react";
import type { AipStatus } from "../types";

type RemarksCardProps = {
  status: AipStatus;
  reviewerMessage?: string | null;
  onCancelSubmission?: () => void;
  onResubmit?: () => void;
};

type Tone = "info" | "warning" | "success";

const STATUS_CONFIG: Record<
  Exclude<AipStatus, "draft">,
  {
    tone: Tone;
    message: string;
    showCancel?: boolean;
    showResubmit?: boolean;
    label?: string;
  }
> = {
  pending_review: {
    tone: "info",
    message:
      "Editing is not allowed while the AIP is pending review. Please wait for the review process to complete.",
    showCancel: true,
    label: "Feedback from Reviewer",
  },
  under_review: {
    tone: "info",
    message:
      "Editing is not allowed while the AIP is under review. Please wait for the review process to complete.",
    label: "Feedback from Reviewer",
  },
  for_revision: {
    tone: "warning",
    message: "Reviewer feedback is available.",
    showResubmit: true,
    label: "Feedback from Reviewer",
  },
  published: {
    tone: "success",
    message: "Annual Investment Plan (AIP) has been officially published.",
  },
};

function getToneStyles(tone: Tone) {
  switch (tone) {
    case "success":
      return {
        wrapper: "border-emerald-200 bg-emerald-50 text-emerald-800",
        icon: "text-emerald-600",
      };
    case "warning":
      return {
        wrapper: "border-amber-200 bg-amber-50 text-amber-800",
        icon: "text-amber-600",
      };
    case "info":
    default:
      return {
        wrapper: "border-sky-200 bg-sky-50 text-sky-800",
        icon: "text-sky-600",
      };
  }
}

function ToneIcon({ tone }: { tone: Tone }) {
  if (tone === "success") return <CheckCircle2 className="h-4 w-4" />;
  if (tone === "warning") return <TriangleAlert className="h-4 w-4" />;
  return <AlertCircle className="h-4 w-4" />;
}

export function RemarksCard({
  status,
  reviewerMessage,
  onCancelSubmission,
  onResubmit,
}: RemarksCardProps) {
  if (status === "draft") return null;

  const config = STATUS_CONFIG[status];
  const styles = getToneStyles(config.tone);
  const message =
    status === "for_revision" && reviewerMessage
      ? reviewerMessage
      : config.message;

  return (
    <Card className="border-slate-200">
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Remarks</h3>

        <div className={`rounded-lg border p-3 text-sm ${styles.wrapper}`}>
          <div className="flex items-start gap-2">
            <span className={`${styles.icon} mt-0.5`}>
              <ToneIcon tone={config.tone} />
            </span>
            <div className="space-y-2">
              {config.label ? (
                <div className="text-xs font-semibold uppercase tracking-wide">
                  {config.label}
                </div>
              ) : null}
              <p>{message}</p>
            </div>
          </div>
        </div>

        {config.showCancel ? (
          <div className="flex justify-end">
            <Button
              className="bg-rose-600 hover:bg-rose-700"
              onClick={onCancelSubmission}
              disabled={!onCancelSubmission}
            >
              <X className="h-4 w-4" />
              Cancel Submission
            </Button>
          </div>
        ) : null}

        {config.showResubmit ? (
          <div className="flex justify-end">
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={onResubmit}
              disabled={!onResubmit}
            >
              <RotateCw className="h-4 w-4" />
              Resubmit
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
