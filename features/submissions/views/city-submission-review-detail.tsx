"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import type { AipHeader } from "@/lib/repos/aip/types";
import { getAipStatusBadgeClass } from "@/lib/ui/status";
import { AipPdfContainer } from "@/components/aip/aip-pdf-container";
import { AipDetailsSummary } from "@/components/aip/aip-details-summary";
import { AipUploaderInfo } from "@/components/aip/aip-uploader-info";
import { RemarksCard } from "@/components/aip/remarks-card";
import { AipDetailsTableView } from "@/components/aip/aip-details-table-view";
import { getAipProjectRepo } from "@/lib/repos/aip/repo";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import type { LatestReview } from "@/lib/repos/submissions/repo";
import { getAipStatusLabel } from "@/lib/mappers/submissions";
import { PublishSuccessCard } from "../components/PublishSuccessCard";
import { ReviewActionsCard } from "../components/reviewActionsCard";
import { ReviewConfirmDialogs } from "../components/reviewConfirmDialogs";
import { useSubmissionReview } from "../hooks/use-submission-review";

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
    router.replace(`/city/submissions/aip/${aip.id}?mode=review&result=published`);
  }

  const review = useSubmissionReview({
    aipId: aip.id,
    isReviewMode,
    initialResult: result,
    status: aip.status,
    onPublished: goToPublishedSuccess,
    onRequestedRevision: goToViewMode,
  });

  if (review.showSuccess) {
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
          <AipDetailsSummary aip={aip} communityLabel="city" />
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
          {review.canReview ? (
            <ReviewActionsCard
              canReview={review.canReview}
              note={review.note}
              onNoteChange={(value) => {
                review.setNote(value);
                review.setNoteError(null);
              }}
              noteError={review.noteError}
              submitError={review.submitError}
              submitting={review.submitting}
              onPublishClick={() => review.setPublishOpen(true)}
              onRequestRevisionClick={review.openRevisionDialog}
            />
          ) : (
            <RemarksCard status={aip.status} reviewerMessage={revisionNote} />
          )}
        </div>
      </div>

      <ReviewConfirmDialogs
        aipTitle={aip.title}
        barangayName={aip.barangayName}
        note={review.note}
        submitting={review.submitting}
        publishOpen={review.publishOpen}
        revisionOpen={review.revisionOpen}
        onPublishOpenChange={review.setPublishOpen}
        onRevisionOpenChange={review.setRevisionOpen}
        onConfirmPublish={review.confirmPublish}
        onConfirmRevision={review.confirmRequestRevision}
      />
    </div>
  );
}
