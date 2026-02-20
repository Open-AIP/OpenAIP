"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { AipHeader } from "@/features/aip/types";
import { getAipStatusBadgeClass } from "@/features/aip/utils";
import { AipPdfContainer } from "@/features/aip/components/aip-pdf-container";
import { AipDetailsSummary } from "@/features/aip/components/aip-details-summary";
import { AipUploaderInfo } from "@/features/aip/components/aip-uploader-info";
import { RemarksCard } from "@/features/aip/components/remarks-card";
import { AipDetailsTableView } from "@/features/aip/views/aip-details-table";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import type { RoleType } from "@/lib/contracts/databasev2";
import type { LatestReview } from "@/lib/repos/submissions/repo";
import {
  getAipStatusLabel,
  getCitySubmissionAipLabel,
} from "../presentation/submissions.presentation";
import {
  claimReviewAction,
  publishAipAction,
  requestRevisionAction,
} from "../actions/submissionsReview.actions";
import { PublishSuccessCard } from "../components/PublishSuccessCard";

function formatRevisionReplyDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CitySubmissionReviewDetail({
  aip,
  latestReview,
  actorUserId,
  actorRole,
  mode,
  intent,
  result,
  focusedRowId,
}: {
  aip: AipHeader;
  latestReview: LatestReview;
  actorUserId: string | null;
  actorRole: RoleType | null;
  mode?: string;
  intent?: string;
  result?: string;
  focusedRowId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = actorRole === "admin";
  const isReviewMode = mode === "review";
  const aipDisplayLabel = getCitySubmissionAipLabel({
    barangayName: aip.barangayName,
    year: aip.year,
  });
  const breadcrumbItems = [
    { label: "Submissions", href: "/city/submissions" },
    { label: aipDisplayLabel },
  ];
  const hasActiveClaim =
    aip.status === "under_review" && latestReview?.action === "claim_review";
  const isOwner =
    hasActiveClaim &&
    !!actorUserId &&
    latestReview?.reviewerId === actorUserId;
  const assignedToOther = hasActiveClaim && !isOwner;
  const canClaim =
    aip.status === "pending_review" ||
    (aip.status === "under_review" && (!hasActiveClaim || isAdmin));
  const showClaimButton = canClaim && !isOwner;
  const claimLabel =
    aip.status === "pending_review"
      ? "Review & Claim AIP"
      : assignedToOther
        ? "Take Over Review"
        : "Claim Review";
  const canReview = isReviewMode && aip.status === "under_review" && isOwner;

  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const showSuccess = (isReviewMode && result === "published") || publishedSuccess;
  const [claimOpen, setClaimOpen] = useState(false);

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

  useEffect(() => {
    if (intent === "review" && showClaimButton && !isOwner) {
      setClaimOpen(true);
    }
  }, [intent, isOwner, showClaimButton]);

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

  function stayInViewMode() {
    setClaimOpen(false);
    setSubmitError(null);
    router.replace(`/city/submissions/aip/${aip.id}`);
  }

  async function claimReview() {
    setSubmitError(null);
    try {
      setSubmitting(true);
      const response = await claimReviewAction({ aipId: aip.id });
      if (!response.ok) {
        setSubmitError(response.message ?? "Failed to claim review.");
        return;
      }

      setClaimOpen(false);
      router.replace(`/city/submissions/aip/${aip.id}?mode=review`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
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

  function openProjectDetail(projectId: string) {
    const basePath = `/city/submissions/aip/${encodeURIComponent(aip.id)}/${encodeURIComponent(
      projectId
    )}`;
    const query = searchParams.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  if (showSuccess) {
    return (
      <div className="space-y-6">
        <BreadcrumbNav items={breadcrumbItems} />
        <PublishSuccessCard
          barangayName={aip.barangayName}
          onBackToSubmissions={goToSubmissions}
          onViewPublishedAip={goToViewMode}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={breadcrumbItems} />

      <Card className="border-slate-200">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">{aipDisplayLabel}</h1>
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
          <AipDetailsSummary aip={aip} />
          <AipDetailsTableView
            aipId={aip.id}
            year={aip.year}
            aipStatus={aip.status}
            scope="city"
            focusedRowId={focusedRowId}
            enablePagination
            onProjectRowClick={(row) => openProjectDetail(row.id)}
          />
          <AipUploaderInfo aip={aip} />
        </div>

        <div className="lg:sticky lg:top-6 h-fit space-y-6">
          {aip.revisionReply?.body ? (
            <Card className="border-slate-200">
              <CardContent className="space-y-3 p-5">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Barangay Reply to Revision Remarks
                  </div>
                  <div className="text-xs text-slate-500">
                    Response submitted before resubmission.
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="whitespace-pre-wrap text-sm text-emerald-900">
                    {aip.revisionReply.body}
                  </p>
                  <p className="mt-2 text-xs text-emerald-800">
                    {aip.revisionReply.authorName || "Barangay Official"} •{" "}
                    {formatRevisionReplyDate(aip.revisionReply.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

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
          ) : showClaimButton ? (
            <Card className="border-slate-200">
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Review Assignment
                  </div>
                  <div className="text-xs text-slate-500">
                    {assignedToOther
                      ? `Currently assigned to ${latestReview?.reviewerName ?? "another reviewer"}.`
                      : "No reviewer is assigned yet."}
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  {aip.status === "pending_review"
                    ? "Claiming will set this AIP to Under Review and assign it to you."
                    : assignedToOther
                      ? "As admin, you can take over this review before taking actions."
                      : "Claim this AIP to enable publish and revision actions."}
                </div>

                {submitError ? (
                  <div className="text-xs text-rose-600">{submitError}</div>
                ) : null}

                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  onClick={claimReview}
                  disabled={submitting}
                >
                  {claimLabel}
                </Button>
              </CardContent>
            </Card>
          ) : isReviewMode && assignedToOther ? (
            <Card className="border-slate-200">
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Review Actions
                  </div>
                  <div className="text-xs text-slate-500">
                    Assigned to {latestReview?.reviewerName ?? "another reviewer"}.
                    You are in view-only mode.
                  </div>
                </div>

                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write revision comments or feedback..."
                  className="min-h-[90px]"
                  disabled
                />

                <Button className="w-full bg-teal-600 hover:bg-teal-700" disabled>
                  Publish AIP
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-orange-400 text-orange-600 hover:bg-orange-50"
                  disabled
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

      <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Claim Review Ownership</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-600">
            <div>
              Choosing <span className="font-semibold text-slate-900">Review &amp; Claim</span>{" "}
              will assign this AIP to you. Other reviewers will be blocked from publishing
              or requesting revision until ownership changes.
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">
                {aipDisplayLabel}
              </div>
              <div className="text-xs text-slate-500">
                {aip.barangayName ?? "Barangay"}
              </div>
            </div>

            {submitError ? (
              <div className="text-xs text-rose-600">{submitError}</div>
            ) : null}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={stayInViewMode} disabled={submitting}>
                Just View
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={claimReview}
                disabled={submitting}
              >
                {claimLabel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <div className="text-sm font-semibold text-slate-900">
                {aipDisplayLabel}
              </div>
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
