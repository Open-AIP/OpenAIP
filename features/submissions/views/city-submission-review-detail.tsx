"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { AipHeader } from "@/features/aip/types";
import { getAipStatusBadgeClass } from "@/features/aip/utils";
import { AipPdfContainer } from "@/features/aip/components/aip-pdf-container";
import { AipDetailsSummary } from "@/features/aip/components/aip-details-summary";
import { AipUploaderInfo } from "@/features/aip/components/aip-uploader-info";
import { RemarksCard } from "@/features/aip/components/remarks-card";
import { AipDetailsTableView } from "@/features/aip/views/aip-details-table";
import { getAipProjectRepo } from "@/lib/repos/aip/selector";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import type { LatestReview } from "@/lib/repos/submissions/repo";
import { getAipStatusLabel } from "../presentation/submissions.presentation";
import { publishAipAction, requestRevisionAction } from "../actions/submissionsReview.actions";
import { PublishSuccessCard } from "../components/PublishSuccessCard";

export default function CitySubmissionReviewDetail({
  aip,
  latestReview,
  mode,
  result,
}: {
  aip: AipHeader;
  latestReview: LatestReview;
  mode?: string;
  result?: string;
}) {
  const router = useRouter();
  const projectRepo = useMemo(() => getAipProjectRepo(), []);
  const isReviewMode = mode === "review";
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const showSuccess = (isReviewMode && result === "published") || publishedSuccess;
  const canReview = isReviewMode && aip.status === "under_review";

  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const revisionNote =
    aip.status === "for_revision" && latestReview?.action === "request_revision"
      ? latestReview.note
      : null;

  function goToSubmissions() {
    router.push("/city/submissions");
  }

  function goToViewMode() {
    router.replace(`/city/submissions/aip/${aip.id}`);
  }

  function goToPublishedSuccess() {
    setPublishedSuccess(true);
    router.replace(`/city/submissions/aip/${aip.id}?mode=review&result=published`);
  }

  async function confirmPublish() {
    setSubmitError(null);
    try {
      setSubmitting(true);
      const trimmed = note.trim();
      const response = await publishAipAction({
        aipId: aip.id,
        note: trimmed ? trimmed : undefined,
      });

      if (!response.ok) {
        setSubmitError(response.message ?? "Failed to publish AIP.");
        return;
      }

      setPublishOpen(false);
      setNote("");
      setPublishedSuccess(true);
      goToPublishedSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmRequestRevision() {
    setSubmitError(null);
    const trimmed = note.trim();
    if (!trimmed) {
      setNoteError("Revision comments are required.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await requestRevisionAction({ aipId: aip.id, note: trimmed });

      if (!response.ok) {
        setSubmitError(response.message ?? "Failed to request revision.");
        return;
      }

      setRevisionOpen(false);
      setNote("");
      goToViewMode();
    } finally {
      setSubmitting(false);
    }
  }

  if (showSuccess) {
    return (
      <PublishSuccessCard
        barangayName={aip.barangayName}
        onBackToSubmissions={goToSubmissions}
        onViewPublishedAip={goToViewMode}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">{aip.title}</h1>
          <Badge
            variant="outline"
            className={`rounded-full ${getAipStatusBadgeClass(aip.status)}`}
          >
            {getAipStatusLabel(aip.status)}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <AipPdfContainer aip={aip} />
          <AipDetailsSummary aip={aip} scope="city" />
          <AipDetailsTableView
            aipId={aip.id}
            year={aip.year}
            repo={projectRepo}
            aipStatus={aip.status}
            focusedRowId={undefined}
          />
          <AipUploaderInfo aip={aip} />
        </div>

        <div className="lg:sticky lg:top-6 h-fit space-y-6">
          {canReview ? (
            <Card className="border-slate-200">
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Review Actions
                  </div>
                  <div className="text-xs text-slate-500">
                    Make a decision on this AIP
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-700">
                    Revision Comments <span className="text-rose-600">*</span>
                  </div>
                  <Textarea
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                      setNoteError(null);
                    }}
                    placeholder="Write revision comments or feedback..."
                    className="min-h-[90px]"
                  />
                  {noteError ? (
                    <div className="text-xs text-rose-600">{noteError}</div>
                  ) : null}
                </div>

                {submitError ? (
                  <div className="text-xs text-rose-600">{submitError}</div>
                ) : null}

                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  onClick={() => setPublishOpen(true)}
                  disabled={!canReview || submitting}
                >
                  Publish AIP
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-orange-400 text-orange-600 hover:bg-orange-50"
                  onClick={() => {
                    const trimmed = note.trim();
                    if (!trimmed) {
                      setNoteError("Revision comments are required.");
                      return;
                    }
                    setRevisionOpen(true);
                  }}
                  disabled={!canReview || submitting}
                >
                  Request Revision
                </Button>
              </CardContent>
            </Card>
          ) : (
            <RemarksCard status={aip.status} reviewerMessage={revisionNote} />
          )}
        </div>
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Publish AIP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-600">
            <div>
              Are you sure you want to publish this Annual Investment Plan? Once
              published, it will be publicly available.
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">{aip.title}</div>
              <div className="text-xs text-slate-500">
                {aip.barangayName ?? "Barangay"}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setPublishOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={confirmPublish}
                disabled={submitting}
              >
                Confirm &amp; Publish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-600">
            <div>
              Are you sure you want to send this AIP back for revision? The
              barangay will be notified with your comments.
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500 mb-1">Your comment:</div>
              <div className="text-sm text-slate-900 whitespace-pre-wrap">
                {note.trim()}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setRevisionOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={confirmRequestRevision}
                disabled={submitting}
              >
                Confirm &amp; Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
