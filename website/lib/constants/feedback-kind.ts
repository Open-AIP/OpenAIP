import type { FeedbackKind } from "@/lib/contracts/databasev2";

export const FEEDBACK_KIND_LABELS: Record<FeedbackKind, string> = {
  question: "Question",
  suggestion: "Suggestion",
  concern: "Concern",
  commend: "Commendation",
  lgu_note: "LGU Note",
  ai_finding: "AI Finding",
};

export const FEEDBACK_KIND_BADGE_CLASSES: Record<FeedbackKind, string> = {
  question: "border-slate-200 text-slate-600",
  suggestion: "border-amber-200 text-amber-700",
  concern: "border-rose-200 text-rose-600",
  commend: "border-emerald-200 text-emerald-600",
  lgu_note: "border-sky-200 text-sky-700",
  ai_finding: "border-violet-200 text-violet-700",
};

export const CATEGORY_KINDS = ["commend", "suggestion", "question", "concern"] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

const DEFAULT_KIND_BADGE_CLASS = "border-slate-200 text-slate-600";

function isFeedbackKind(value: string): value is FeedbackKind {
  return value in FEEDBACK_KIND_LABELS;
}

function formatUnknownKind(kind: string): string {
  return kind
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatFeedbackKind(kind: FeedbackKind | string) {
  if (isFeedbackKind(kind)) {
    return FEEDBACK_KIND_LABELS[kind];
  }
  return formatUnknownKind(kind);
}

export function getFeedbackKindBadge(kind: FeedbackKind | string) {
  const className = isFeedbackKind(kind)
    ? FEEDBACK_KIND_BADGE_CLASSES[kind]
    : DEFAULT_KIND_BADGE_CLASS;

  return {
    label: formatFeedbackKind(kind),
    className,
  };
}
