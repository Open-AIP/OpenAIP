"use client";

import type { AipRevisionFeedbackCycle } from "@/lib/repos/aip/repo";
import { Card, CardContent } from "@/components/ui/card";

const UNKNOWN_REVIEWER_LABEL = "City Reviewer";
const UNKNOWN_REPLY_AUTHOR_LABEL = "Barangay Official";

export const MISSING_REVIEWER_REMARK_FALLBACK =
  "City reviewer remark is unavailable for this cycle.";

function formatFeedbackDate(value: string): string {
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

function feedbackAuthorLabel(params: {
  authorName?: string | null;
  authorRole: "reviewer" | "barangay_official";
}): string {
  if (typeof params.authorName === "string" && params.authorName.trim().length > 0) {
    return params.authorName.trim();
  }
  return params.authorRole === "reviewer"
    ? UNKNOWN_REVIEWER_LABEL
    : UNKNOWN_REPLY_AUTHOR_LABEL;
}

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
    <Card className="border-slate-200">
      <CardContent className="space-y-3 p-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Revision Feedback History</h3>
          <p className="mt-1 text-xs text-slate-500">
            City reviewer remarks and barangay replies grouped by revision cycle.
          </p>
        </div>

        <div className="space-y-3">
          {cycles.length ? (
            cycles.map((cycle) => (
              <div
                key={cycle.cycleId}
                className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="rounded-md border border-slate-300 bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                    <span>
                      {feedbackAuthorLabel({
                        authorName: cycle.reviewerRemark.authorName,
                        authorRole: "reviewer",
                      })}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span>{formatFeedbackDate(cycle.reviewerRemark.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {cycle.reviewerRemark.body}
                  </p>
                </div>

                {cycle.replies.length ? (
                  <div className="space-y-2 pl-3">
                    {cycle.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="rounded-md border border-slate-200 bg-white p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                          <span>
                            {feedbackAuthorLabel({
                              authorName: reply.authorName,
                              authorRole: "barangay_official",
                            })}
                          </span>
                          <span className="text-slate-400">|</span>
                          <span>{formatFeedbackDate(reply.createdAt)}</span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                          {reply.body}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-500">
                    No barangay reply saved for this cycle yet.
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              No revision feedback history yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
