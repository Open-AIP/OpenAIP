"use client";

import type { AipRevisionFeedbackCycle } from "@/lib/repos/aip/repo";
import { RevisionFeedbackHistoryCard } from "@/features/aip/components/revision-feedback-history-card";

const UNKNOWN_REVIEWER_LABEL = "City Reviewer";
const UNKNOWN_REPLY_AUTHOR_LABEL = "Barangay Official";

export const MISSING_REVIEWER_REMARK_FALLBACK =
  "City reviewer remark is unavailable for this cycle.";

export function toCityRevisionFeedbackCycles(input: {
  revisionFeedbackCycles?: AipRevisionFeedbackCycle[];
  revisionReply?: {
    body: string;
    createdAt: string;
    authorName?: string | null;
  };
  feedback?: string;
}): AipRevisionFeedbackCycle[] {
  const cycles = input.revisionFeedbackCycles ?? [];
  if (cycles.length > 0) return cycles;

  const legacyReplyBody = input.revisionReply?.body?.trim();
  if (!legacyReplyBody) return [];

  const reviewerBody =
    typeof input.feedback === "string" && input.feedback.trim().length > 0
      ? input.feedback.trim()
      : MISSING_REVIEWER_REMARK_FALLBACK;

  const reviewerCreatedAt = input.revisionReply?.createdAt ?? new Date().toISOString();
  const cycleId = `legacy-cycle-${input.revisionReply?.createdAt ?? "unknown"}`;
  const replyId = `legacy-reply-${input.revisionReply?.createdAt ?? "unknown"}`;

  return [
    {
      cycleId,
      reviewerRemark: {
        id: `${cycleId}-reviewer`,
        body: reviewerBody,
        createdAt: reviewerCreatedAt,
        authorRole: "reviewer",
      },
      replies: [
        {
          id: replyId,
          body: legacyReplyBody,
          createdAt: input.revisionReply?.createdAt ?? reviewerCreatedAt,
          authorName: input.revisionReply?.authorName ?? null,
          authorRole: "barangay_official",
        },
      ],
    },
  ];
}

export function CityRevisionFeedbackHistoryCard({
  cycles,
}: {
  cycles: AipRevisionFeedbackCycle[];
}) {
  return (
    <RevisionFeedbackHistoryCard
      cycles={cycles}
      title="Revision Feedback History"
      description="City reviewer remarks and barangay replies grouped by revision cycle."
      reviewerFallbackLabel={UNKNOWN_REVIEWER_LABEL}
      replyAuthorFallbackLabel={UNKNOWN_REPLY_AUTHOR_LABEL}
      emptyStateLabel="No revision feedback history yet."
      emptyRepliesLabel="No barangay reply saved for this cycle yet."
    />
  );
}
