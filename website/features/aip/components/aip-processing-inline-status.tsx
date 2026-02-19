"use client";

import type { AipProcessingRunView } from "@/features/aip/types";
import {
  AipProcessingStatusContent,
  type AipProcessingState,
} from "./aip-processing-status-content";

type Props = {
  run: AipProcessingRunView | null;
  state: AipProcessingState;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  errorHint?: string;
};

export function AipProcessingInlineStatus({
  run,
  state,
  onPrimaryAction,
  primaryActionLabel,
  errorHint,
}: Props) {
  return (
    <div className="mx-auto w-full max-w-[900px]">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <AipProcessingStatusContent
          run={run}
          state={state}
          onPrimaryAction={onPrimaryAction}
          primaryActionLabel={primaryActionLabel}
          errorHint={errorHint}
        />
      </div>
    </div>
  );
}

