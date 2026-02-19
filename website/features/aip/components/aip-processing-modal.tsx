"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { AipProcessingRunView } from "@/features/aip/types";
import {
  AipProcessingStatusContent,
  type AipProcessingState,
} from "./aip-processing-status-content";

type Props = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  run: AipProcessingRunView | null;
  state: AipProcessingState;
  onReviewOutput?: () => void;
};

export default function AipProcessingModal({
  open,
  onOpenChange,
  run,
  state,
  onReviewOutput,
}: Props) {
  const isProcessing = state === "processing";

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
        <AipProcessingStatusContent
          run={run}
          state={state}
          onPrimaryAction={onReviewOutput ?? (state === "error" ? () => onOpenChange?.(false) : undefined)}
          primaryActionLabel={state === "complete" ? "Review Output" : state === "error" ? "Close" : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}
