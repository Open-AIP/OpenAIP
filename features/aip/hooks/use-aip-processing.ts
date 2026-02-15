"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AipProcessingRunView } from "@/features/aip/types";
import { createRun, getRun, getRunByAip } from "@/lib/aip/pipeline-client";

const isComplete = (run: AipProcessingRunView | null) =>
  !!run && run.status === "succeeded" && run.stage === "categorize" && run.progressByStage.categorize >= 100;

const isFailed = (run: AipProcessingRunView | null) => !!run && run.status === "failed";

export function useAipProcessing({
  aipId,
  enabled,
}: {
  aipId: string | null;
  enabled: boolean;
}) {
  const [run, setRun] = useState<AipProcessingRunView | null>(null);
  const [uiState, setUiState] = useState<"idle" | "processing" | "complete" | "error">("idle");
  const [open, setOpen] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const runIdRef = useRef<string | null>(null);

  const evaluateState = useCallback((nextRun: AipProcessingRunView | null) => {
    if (!nextRun) {
      setUiState("idle");
      setOpen(false);
      return;
    }
    if (isFailed(nextRun)) {
      setUiState("error");
      setOpen(true);
      return;
    }
    if (isComplete(nextRun)) {
      setUiState("complete");
      setOpen(true);
      return;
    }
    setUiState("processing");
    setOpen(true);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  const startPolling = useCallback((runId: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const latest = await getRun(runId);
        setRun(latest);
        evaluateState(latest);
        if (isFailed(latest) || isComplete(latest)) {
          stopPolling();
        }
      } catch {
        stopPolling();
        setUiState("error");
        setOpen(true);
      }
    }, 1200);
  }, [evaluateState, stopPolling]);

  useEffect(() => {
    let active = true;
    if (!enabled || !aipId) {
      stopPolling();
      runIdRef.current = null;
      queueMicrotask(() => {
        setRun(null);
        setUiState("idle");
        setOpen(false);
      });
      return;
    }

    const init = async () => {
      try {
        const existing = await getRunByAip(aipId);
        const nextRun = existing ?? (await createRun(aipId));
        if (!active) return;
        runIdRef.current = nextRun.runId;
        setRun(nextRun);
        evaluateState(nextRun);
        if (!isComplete(nextRun) && !isFailed(nextRun)) {
          startPolling(nextRun.runId);
        }
      } catch (error) {
        if (!active) return;
        stopPolling();
        setRun(
          (prev) =>
            prev ?? {
              runId: "run-error",
              aipId,
              status: "failed",
              stage: "extract",
              progressByStage: {
                extract: 0,
                validate: 0,
                summarize: 0,
                categorize: 0,
              },
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to start processing run.",
              updatedAt: new Date().toISOString(),
            }
        );
        setUiState("error");
        setOpen(true);
      }
    };

    init();

    return () => {
      active = false;
    };
  }, [aipId, enabled, evaluateState, startPolling, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const actions = useMemo(
    () => ({
      close: () => {
        if (uiState === "processing") return false;
        setOpen(false);
        setUiState("idle");
        setRun(null);
        return true;
      },
      review: () => true,
    }),
    [uiState]
  );

  return { open, uiState, run, actions };
}
