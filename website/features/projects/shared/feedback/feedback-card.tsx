"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/utils";
import type { ProjectFeedbackDisplayKind, ProjectFeedbackItem } from "./feedback.types";

type FeedbackCardProps = {
  item: ProjectFeedbackItem;
  onReply: (item: ProjectFeedbackItem) => void;
  replyDisabled?: boolean;
  isReply?: boolean;
  hideLguNoteBadge?: boolean;
  hideReplyButton?: boolean;
};

const KIND_LABELS: Record<ProjectFeedbackDisplayKind, string> = {
  commend: "Commend",
  suggestion: "Suggestion",
  concern: "Concern",
  question: "Question",
  lgu_note: "LGU Note",
};

const KIND_BADGE_CLASSES: Record<ProjectFeedbackDisplayKind, string> = {
  commend: "border-emerald-200 text-emerald-700",
  suggestion: "border-amber-200 text-amber-700",
  concern: "border-rose-200 text-rose-700",
  question: "border-slate-200 text-slate-700",
  lgu_note: "border-sky-200 text-sky-700",
};

function formatFeedbackTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown time";

  const dateLabel = parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
  const timeLabel = parsed.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  });

  return `${dateLabel} \u2022 ${timeLabel}`;
}

export function FeedbackCard({
  item,
  onReply,
  replyDisabled = false,
  isReply = false,
  hideLguNoteBadge = false,
  hideReplyButton = false,
}: FeedbackCardProps) {
  const isLguNote = item.kind === "lgu_note";
  const shouldShowKindBadge = !(hideLguNoteBadge && isLguNote);

  return (
    <article
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
        isReply && "rounded-lg",
        isLguNote && "border-sky-200 bg-sky-50/50"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{item.author.fullName}</p>
          <p className="text-xs text-slate-500">
            {item.author.roleLabel} | {item.author.lguLabel}
          </p>
        </div>
        <p className="text-xs text-slate-500">{formatFeedbackTimestamp(item.createdAt)}</p>
      </div>

      {shouldShowKindBadge ? (
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="outline" className={cn("rounded-full", KIND_BADGE_CLASSES[item.kind])}>
            {KIND_LABELS[item.kind]}
          </Badge>
        </div>
      ) : null}

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.body}</p>

      {!hideReplyButton ? (
        <div className="mt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
            aria-label={`Reply to feedback from ${item.author.fullName}`}
            onClick={() => onReply(item)}
            disabled={replyDisabled}
          >
            Reply
          </Button>
        </div>
      ) : null}
    </article>
  );
}
