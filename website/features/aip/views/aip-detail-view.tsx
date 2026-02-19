"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, RotateCw, Send, X } from "lucide-react";

import type {
  AipHeader,
  AipProcessingRunView,
  PipelineStageUi,
  PipelineStatusUi,
} from "../types";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { getAipStatusBadgeClass } from "../utils";
import { AipPdfContainer } from "../components/aip-pdf-container";
import { AipDetailsSummary } from "../components/aip-details-summary";
import { AipUploaderInfo } from "../components/aip-uploader-info";
import { AipProcessingInlineStatus } from "../components/aip-processing-inline-status";
import type { AipProcessingState } from "../components/aip-processing-status-content";
import { RemarksCard } from "../components/remarks-card";
import { AipDetailsTableView } from "./aip-details-table";
import { CommentThreadsSplitView } from "@/features/feedback";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PIPELINE_STAGES: PipelineStageUi[] = [
  "extract",
  "validate",
  "summarize",
  "categorize",
  "embed",
];

const PIPELINE_STATUS: PipelineStatusUi[] = ["queued", "running", "succeeded", "failed"];
const FINALIZE_REFRESH_MAX_ATTEMPTS = 5;
const FINALIZE_REFRESH_INTERVAL_MS = 1500;
const FINALIZE_PROGRESS_MESSAGE =
  "Saving processed data to the database. You will be redirected shortly.";

type RunStatusPayload = {
  runId: string;
  status: string;
  stage: string;
  errorMessage: string | null;
  overallProgressPct?: number | null;
  stageProgressPct?: number | null;
  progressMessage?: string | null;
  progressUpdatedAt?: string | null;
};

type ActiveRunLookupPayload = {
  run: {
    runId: string;
    aipId: string;
    stage: PipelineStageUi;
    status: "queued" | "running";
    errorMessage: string | null;
    createdAt: string | null;
  } | null;
};

function isPipelineStageUi(value: string): value is PipelineStageUi {
  return PIPELINE_STAGES.includes(value as PipelineStageUi);
}

function isPipelineStatusUi(value: string): value is PipelineStatusUi {
  return PIPELINE_STATUS.includes(value as PipelineStatusUi);
}

function mapRunStatusToProcessingState(status: PipelineStatusUi): AipProcessingState {
  if (status === "queued" || status === "running") return "processing";
  if (status === "failed") return "error";
  return "complete";
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function hasSummaryText(summaryText: string | undefined): boolean {
  return typeof summaryText === "string" && summaryText.trim().length > 0;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function buildProgressByStage(
  stage: PipelineStageUi | null,
  status: PipelineStatusUi | null,
  stageProgressPct?: number | null
): Record<PipelineStageUi, number> {
  const progressByStage: Record<PipelineStageUi, number> = {
    extract: 0,
    validate: 0,
    summarize: 0,
    categorize: 0,
    embed: 0,
  };

  if (!stage || !status) return progressByStage;

  const activeIndex = PIPELINE_STAGES.indexOf(stage);
  if (activeIndex < 0) return progressByStage;

  for (let index = 0; index < PIPELINE_STAGES.length; index += 1) {
    const key = PIPELINE_STAGES[index];
    if (status === "succeeded") {
      progressByStage[key] = 100;
      continue;
    }
    if (index < activeIndex) {
      progressByStage[key] = 100;
      continue;
    }
    if (index > activeIndex) {
      progressByStage[key] = 0;
      continue;
    }
    if (status === "queued") {
      progressByStage[key] =
        typeof stageProgressPct === "number" ? clampProgress(stageProgressPct) : 0;
      continue;
    }
    if (status === "running") {
      progressByStage[key] =
        typeof stageProgressPct === "number" ? clampProgress(stageProgressPct) : 0;
      continue;
    }
    if (status === "failed") {
      progressByStage[key] =
        typeof stageProgressPct === "number" ? clampProgress(stageProgressPct) : 80;
      continue;
    }
  }

  return progressByStage;
}

export default function AipDetailView({
  aip,
  scope = "barangay",
  onEdit,
  onResubmit,
  onCancel,
  onCancelSubmission,
  onSubmit,
}: {
  aip: AipHeader;
  scope?: "city" | "barangay";
  onEdit?: () => void;
  onResubmit?: () => void;
  onCancel?: () => void;
  onCancelSubmission?: () => void;
  onSubmit?: () => void;
}) {
  const showFeedback = aip.status === "for_revision";
  const showRemarks = aip.status !== "draft";
  const isBarangayScope = scope === "barangay";

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const threadId = searchParams.get("thread");
  const tab = searchParams.get("tab");
  const runIdFromQuery = searchParams.get("run");
  const activeTab = tab === "comments" ? "comments" : "summary";

  const [activeRunId, setActiveRunId] = useState<string | null>(runIdFromQuery);
  const [isCheckingRun, setIsCheckingRun] = useState<boolean>(
    isBarangayScope && !runIdFromQuery
  );
  const [processingRun, setProcessingRun] = useState<AipProcessingRunView | null>(null);
  const [processingState, setProcessingState] = useState<AipProcessingState>("idle");
  const [runNotice, setRunNotice] = useState<string | null>(null);
  const [failedRun, setFailedRun] = useState<{
    runId: string;
    message: string | null;
  } | null>(null);
  const [dismissedFailedRunId, setDismissedFailedRunId] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isFinalizingAfterSuccess, setIsFinalizingAfterSuccess] = useState(false);
  const [finalizingNotice, setFinalizingNotice] = useState<string | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // `focus` is only meaningful in the context of the feedback/comments UI.
  // Avoid showing a "focused row" outline in the AIP details table (Summary tab).
  const focusedRowId =
    activeTab === "comments" ? searchParams.get("focus") ?? undefined : undefined;

  const handleCancelDraft =
    onCancel ?? (() => console.log("Canceling AIP draft:", aip.id));
  const handleSubmitForReview =
    onSubmit ?? (() => console.log("Submitting AIP for review:", aip.id));

  const clearRunQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("run")) return;
    params.delete("run");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!isBarangayScope) {
      setIsCheckingRun(false);
      setActiveRunId(null);
      setIsFinalizingAfterSuccess(false);
      return;
    }

    if (isFinalizingAfterSuccess) {
      setIsCheckingRun(false);
      return;
    }

    if (runIdFromQuery) {
      setIsCheckingRun(false);
      setActiveRunId(runIdFromQuery);
      setIsFinalizingAfterSuccess(false);
      setFinalizingNotice(null);
      return;
    }

    let cancelled = false;
    setIsCheckingRun(true);
    setRunNotice(null);

    async function lookupActiveRun() {
      try {
        const response = await fetch(
          `/api/barangay/aips/${encodeURIComponent(aip.id)}/runs/active`
        );
        if (!response.ok) {
          throw new Error("Failed to check extraction status.");
        }
        const payload = (await response.json()) as ActiveRunLookupPayload;
        if (cancelled) return;

        if (payload.run?.runId) {
          setActiveRunId(payload.run.runId);
          setProcessingState("processing");
          setIsFinalizingAfterSuccess(false);
          setFailedRun(null);
          setDismissedFailedRunId(null);
          setRetryError(null);
          setFinalizingNotice(null);
        } else {
          setActiveRunId(null);
          setProcessingState("idle");
        }
      } catch {
        if (cancelled) return;
        setActiveRunId(null);
        setProcessingState("idle");
        setRunNotice("Unable to check extraction status right now. Showing AIP details.");
      } finally {
        if (!cancelled) {
          setIsCheckingRun(false);
        }
      }
    }

    void lookupActiveRun();

    return () => {
      cancelled = true;
    };
  }, [aip.id, isBarangayScope, isFinalizingAfterSuccess, runIdFromQuery]);

  useEffect(() => {
    if (!isBarangayScope || !activeRunId) {
      if (!isFinalizingAfterSuccess) {
        setProcessingRun(null);
        setProcessingState("idle");
      }
      return;
    }

    const currentRunId = activeRunId;
    let cancelled = false;
    let timer: number | null = null;
    setProcessingState("processing");
    setIsFinalizingAfterSuccess(false);
    setFinalizingNotice(null);
    setRunNotice(null);
    setRetryError(null);

    async function poll() {
      try {
        const res = await fetch(
          `/api/barangay/aips/runs/${encodeURIComponent(currentRunId)}`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch extraction run status.");
        }

        const payload = (await res.json()) as RunStatusPayload;
        if (cancelled) return;

        if (!isPipelineStatusUi(payload.status) || !isPipelineStageUi(payload.stage)) {
          throw new Error("Unexpected extraction status payload.");
        }

        const shouldShowSyncingMessage =
          (payload.status === "queued" || payload.status === "running") &&
          typeof payload.stageProgressPct !== "number" &&
          !payload.progressMessage;

        setProcessingRun({
          stage: payload.stage,
          status: payload.status,
          message:
            payload.errorMessage ??
            (shouldShowSyncingMessage ? "Syncing live progress..." : null),
          progressByStage: buildProgressByStage(
            payload.stage,
            payload.status,
            payload.stageProgressPct
          ),
          overallProgressPct: payload.overallProgressPct ?? null,
          stageProgressPct: payload.stageProgressPct ?? null,
          progressMessage:
            payload.progressMessage ??
            (shouldShowSyncingMessage ? "Syncing live progress..." : null),
        });

        const nextState = mapRunStatusToProcessingState(payload.status);
        if (nextState === "processing") {
          setProcessingState("processing");
          setFailedRun(null);
          return;
        }

        if (timer) window.clearInterval(timer);

        if (nextState === "complete") {
          setActiveRunId(null);
          setFailedRun(null);
          setDismissedFailedRunId(null);
          setRetryError(null);
          setRunNotice(null);
          setProcessingState("processing");
          setIsFinalizingAfterSuccess(true);
          setFinalizingNotice(null);
          setProcessingRun({
            stage: "categorize",
            status: "running",
            message: FINALIZE_PROGRESS_MESSAGE,
            progressByStage: buildProgressByStage("categorize", "running", 100),
            overallProgressPct: 100,
            stageProgressPct: 100,
            progressMessage: FINALIZE_PROGRESS_MESSAGE,
          });
          if (runIdFromQuery) {
            clearRunQuery();
          }
          return;
        }

        setProcessingRun(null);
        setProcessingState("idle");
        setIsFinalizingAfterSuccess(false);
        setActiveRunId(null);
        setFailedRun({
          runId: currentRunId,
          message: payload.errorMessage ?? payload.progressMessage ?? null,
        });
        setDismissedFailedRunId(null);
        setRetryError(null);
        if (runIdFromQuery) {
          clearRunQuery();
        }
      } catch {
        if (cancelled) return;
        if (timer) window.clearInterval(timer);
        setProcessingRun(null);
        setProcessingState("idle");
        setIsFinalizingAfterSuccess(false);
        setActiveRunId(null);
        setRunNotice("Unable to fetch extraction status right now. Showing AIP details.");
        if (runIdFromQuery) {
          clearRunQuery();
        }
      }
    }

    void poll();
    timer = window.setInterval(() => {
      void poll();
    }, 3000);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [
    activeRunId,
    clearRunQuery,
    isBarangayScope,
    isCheckingRun,
    isFinalizingAfterSuccess,
    runIdFromQuery,
  ]);

  useEffect(() => {
    if (!isFinalizingAfterSuccess) return;

    if (hasSummaryText(aip.summaryText)) {
      setIsFinalizingAfterSuccess(false);
      setProcessingRun(null);
      setProcessingState("idle");
      setFinalizingNotice(null);
      return;
    }

    let cancelled = false;

    async function refreshUntilSummaryIsReady() {
      for (
        let attempt = 1;
        attempt <= FINALIZE_REFRESH_MAX_ATTEMPTS;
        attempt += 1
      ) {
        if (cancelled) return;
        router.refresh();
        await wait(FINALIZE_REFRESH_INTERVAL_MS);
      }

      if (cancelled) return;

      setIsFinalizingAfterSuccess(false);
      setProcessingRun(null);
      setProcessingState("idle");
      setFinalizingNotice(
        "Processing completed, but the updated summary is still syncing. Click refresh to load the latest output."
      );
    }

    void refreshUntilSummaryIsReady();

    return () => {
      cancelled = true;
    };
  }, [aip.summaryText, isFinalizingAfterSuccess, router]);

  useEffect(() => {
    if (!finalizingNotice) return;
    if (!hasSummaryText(aip.summaryText)) return;
    setFinalizingNotice(null);
  }, [aip.summaryText, finalizingNotice]);

  const handleManualRefresh = useCallback(() => {
    setIsManualRefreshing(true);
    router.refresh();
    window.setTimeout(() => {
      setIsManualRefreshing(false);
    }, 1200);
  }, [router]);

  const handleRetryFailedRun = useCallback(async () => {
    if (!failedRun) return;

    try {
      setIsRetrying(true);
      setRetryError(null);
      setRunNotice(null);

      const response = await fetch(
        `/api/barangay/aips/runs/${encodeURIComponent(failedRun.runId)}/retry`,
        { method: "POST" }
      );

      const payload = (await response.json()) as {
        message?: string;
        runId?: string;
      };

      if (!response.ok || !payload.runId) {
        throw new Error(payload.message ?? "Failed to retry extraction run.");
      }

      setFailedRun(null);
      setDismissedFailedRunId(null);
      setActiveRunId(payload.runId);
      setProcessingState("processing");
      setIsFinalizingAfterSuccess(false);
      setFinalizingNotice(null);
    } catch (error) {
      setRetryError(
        error instanceof Error ? error.message : "Failed to retry extraction run."
      );
    } finally {
      setIsRetrying(false);
    }
  }, [failedRun]);

  const breadcrumb = [
    { label: "AIP Management", href: `/${scope}/aips` },
    { label: aip.title, href: "#" },
  ];

  const shouldBlockWithProcessingUi =
    isBarangayScope &&
    (isCheckingRun ||
      isFinalizingAfterSuccess ||
      (Boolean(activeRunId) && processingState === "processing"));

  const failedNoticeRun =
    failedRun && dismissedFailedRunId !== failedRun.runId ? failedRun : null;

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={breadcrumb} />

      {shouldBlockWithProcessingUi ? (
        isCheckingRun ? (
          <div className="mx-auto w-full max-w-[900px] rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
            Checking extraction status...
          </div>
        ) : (
          <AipProcessingInlineStatus run={processingRun} state="processing" />
        )
      ) : (
        <>
          {/* title bar */}
          <Card className="border-slate-200">
            <CardContent className="flex items-center justify-between gap-4 p-6">
              <h1 className="text-2xl font-bold text-slate-900">{aip.title}</h1>

              <Badge
                variant="outline"
                className={`rounded-full ${getAipStatusBadgeClass(aip.status)}`}
              >
                {aip.status}
              </Badge>
            </CardContent>
          </Card>

          {runNotice ? (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-800">{runNotice}</AlertDescription>
            </Alert>
          ) : null}

          {finalizingNotice ? (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTitle className="text-amber-900">Processing Complete</AlertTitle>
              <AlertDescription className="space-y-3 text-amber-800">
                <p>{finalizingNotice}</p>
                <div className="flex justify-start">
                  <Button
                    variant="outline"
                    className="border-amber-300 text-amber-900 hover:bg-amber-100"
                    onClick={handleManualRefresh}
                    disabled={isManualRefreshing}
                  >
                    {isManualRefreshing ? "Refreshing..." : "Refresh now"}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : null}

          {failedNoticeRun ? (
            <Alert className="border-rose-200 bg-rose-50">
              <AlertTitle className="text-rose-900">Extraction Failed</AlertTitle>
              <AlertDescription className="space-y-3 text-rose-800">
                <p>
                  {failedNoticeRun.message ??
                    "We were unable to complete the AIP extraction pipeline."}
                </p>
                {retryError ? <p>{retryError}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-rose-600 hover:bg-rose-700"
                    onClick={handleRetryFailedRun}
                    disabled={isRetrying}
                  >
                    {isRetrying ? "Retrying..." : "Retry Extraction"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setDismissedFailedRunId(failedNoticeRun.runId)}
                    disabled={isRetrying}
                  >
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : null}

          <div
            className={
              showRemarks ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" : "space-y-6"
            }
          >
            <div className="space-y-6">
              <AipPdfContainer aip={aip} />

              <div className="flex items-center gap-3">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (value === "comments") {
                      params.set("tab", "comments");
                      params.delete("thread");
                    } else {
                      params.delete("tab");
                      params.delete("thread");
                      params.delete("focus");
                    }
                    const query = params.toString();
                    router.replace(query ? `${pathname}?${query}` : pathname, {
                      scroll: false,
                    });
                  }}
                >
                  <TabsList className="h-10 gap-2 bg-transparent p-0">
                    <TabsTrigger
                      value="summary"
                      className="h-9 rounded-lg px-4 text-sm font-medium text-slate-500 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                    >
                      Summary
                    </TabsTrigger>
                    <TabsTrigger
                      value="comments"
                      className="h-9 rounded-lg px-4 text-sm font-medium text-slate-500 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                      onClick={() => {
                        if (activeTab !== "comments") return;
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("tab", "comments");
                        params.delete("thread");
                        const query = params.toString();
                        router.replace(query ? `${pathname}?${query}` : pathname, {
                          scroll: false,
                        });
                      }}
                    >
                      Feedback
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {activeTab === "summary" ? (
                <>
                  <AipDetailsSummary aip={aip} />

                  <AipDetailsTableView
                    aipId={aip.id}
                    year={aip.year}
                    aipStatus={aip.status}
                    focusedRowId={focusedRowId}
                    enablePagination={scope === "barangay"}
                  />

                  <AipUploaderInfo aip={aip} />
                </>
              ) : (
                <div className="space-y-6">
                  <CommentThreadsSplitView
                    scope={scope}
                    target={{ kind: "aip", aipId: aip.id }}
                    selectedThreadId={threadId}
                  />
                </div>
              )}

              {/* Bottom action */}
              <div className="flex justify-end gap-3">
                {showFeedback ? (
                  <>
                    <Button variant="outline" onClick={onEdit} disabled={!onEdit}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      className="bg-teal-600 hover:bg-teal-700"
                      onClick={onResubmit}
                      disabled={!onResubmit}
                    >
                      <RotateCw className="h-4 w-4" />
                      Resubmit
                    </Button>
                  </>
                ) : null}

                {aip.status === "draft" ? (
                  <>
                    <Button variant="outline" onClick={handleCancelDraft}>
                      <X className="h-4 w-4" />
                      Cancel Draft
                    </Button>
                    <Button
                      className="bg-[#022437] hover:bg-[#022437]/90"
                      onClick={handleSubmitForReview}
                    >
                      <Send className="h-4 w-4" />
                      Submit for Review
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            {showRemarks ? (
              <div className="h-fit lg:sticky lg:top-6">
                <RemarksCard
                  status={aip.status}
                  reviewerMessage={aip.feedback}
                  onCancelSubmission={onCancelSubmission ?? onCancel}
                  onResubmit={onResubmit}
                />
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
