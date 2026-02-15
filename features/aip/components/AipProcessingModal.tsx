"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/ui/utils";
import type {
  AipProcessingRunView,
  PipelineStageUi,
  PipelineStatusUi,
} from "@/features/aip/types";

const STAGES: { key: PipelineStageUi; label: string; message: string }[] = [
  { key: "extract", label: "Extraction", message: "Extracting data from document..." },
  { key: "validate", label: "Validation", message: "Validating extracted information..." },
  { key: "summarize", label: "Summarization", message: "Generating summary and insights..." },
  { key: "categorize", label: "Categorization", message: "Categorizing projects and entries..." },
];

const clampProgress = (value: number) => Math.min(100, Math.max(0, value));

type Props = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  run: AipProcessingRunView | null;
  state: "idle" | "processing" | "complete" | "error";
  onReviewOutput?: () => void;
};

const getActiveStageIndex = (stage: PipelineStageUi | null) =>
  Math.max(0, STAGES.findIndex((s) => s.key === stage));

const getStatusMessage = (stage: PipelineStageUi | null) => {
  if (!stage) return "Preparing submission...";
  return STAGES.find((s) => s.key === stage)?.message ?? "Processing...";
};

const isStageComplete = (
  stage: PipelineStageUi,
  progressByStage: Record<PipelineStageUi, number> | null,
  status: PipelineStatusUi | null
) => {
  if (!progressByStage) return false;
  return clampProgress(progressByStage[stage]) >= 100 || status === "succeeded";
};

export default function AipProcessingModal({
  open,
  onOpenChange,
  run,
  state,
  onReviewOutput,
}: Props) {
  const activeIndex = getActiveStageIndex(run?.stage ?? "extract");
  const isProcessing = state === "processing";
  const statusMessage = run?.message || getStatusMessage(run?.stage ?? null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isProcessing) return;
        onOpenChange?.(next);
      }}
    >
      <DialogContent
        className="sm:max-w-[900px] p-0 overflow-hidden"
        showCloseButton={!isProcessing}
        onEscapeKeyDown={(event) => {
          if (isProcessing) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (isProcessing) event.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">Processing AIP Submission</DialogTitle>
        <div className="px-10 pt-10 pb-8 text-center">
          <div className="text-2xl font-semibold text-[#0E5D6F]">Processing AIP Submission</div>
          <div className="mt-2 text-sm text-slate-500">Please wait while the AI processes your data.</div>
        </div>

        {state === "complete" ? (
          <div className="px-10 pb-10 text-center space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-7 w-7" />
            </div>
            <div>
              <div className="text-xl font-semibold text-slate-900">Processing Complete</div>
              <div className="mt-2 text-sm text-slate-500">
                Your AIP submission has been processed successfully.
              </div>
            </div>
            <Button className="h-11 px-8 bg-[#0E5D6F] hover:bg-[#0E5D6F]/90" onClick={onReviewOutput}>
              Review Output
            </Button>
          </div>
        ) : state === "error" ? (
          <div className="px-10 pb-10 space-y-6">
            <div className="text-center space-y-2">
              <div className="text-xl font-semibold text-slate-900">Processing Failed</div>
              <div className="text-sm text-slate-500">{run?.message ?? "Please try again later."}</div>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              We were unable to complete the AIP processing pipeline. You can close this dialog and retry the upload.
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange?.(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-b from-[#F1FAFF] to-white px-10 pb-10">
              <div className="flex items-center justify-between gap-4">
                {STAGES.map((stage, index) => {
                  const completed = isStageComplete(stage.key, run?.progressByStage ?? null, run?.status ?? null);
                  const active = activeIndex === index;
                  return (
                    <div key={stage.key} className="flex flex-1 flex-col items-center gap-3">
                      <div className="flex items-center w-full gap-3">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-full border-2 flex items-center justify-center text-sm font-semibold",
                            completed || active
                              ? "bg-[#0E5D6F] border-[#0E5D6F] text-white shadow"
                              : "border-slate-200 text-slate-400 bg-white"
                          )}
                        >
                          {completed && !active ? <Check className="h-5 w-5" /> : index + 1}
                        </div>
                        {index < STAGES.length - 1 && (
                          <div
                            className={cn(
                              "h-1 flex-1 rounded-full",
                              completed ? "bg-[#0E5D6F]" : "bg-slate-200"
                            )}
                          />
                        )}
                      </div>
                      <div className={cn("text-xs font-semibold", active ? "text-[#0E5D6F]" : "text-slate-500")}>
                        {stage.label}
                      </div>
                      <div className="w-full space-y-2">
                        <Progress value={clampProgress(run?.progressByStage?.[stage.key] ?? 0)} className="h-2" />
                        <div className="text-center text-[11px] text-slate-500">
                          {clampProgress(run?.progressByStage?.[stage.key] ?? 0)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 text-center text-sm text-slate-600" aria-live="polite">
                {statusMessage}
              </div>
            </div>

            <div className="px-10 py-4 text-center text-xs text-slate-500 border-t">
              This process cannot be interrupted. Please do not close or refresh the page.
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
