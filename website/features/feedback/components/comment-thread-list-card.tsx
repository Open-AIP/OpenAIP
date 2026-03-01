import { Badge } from "@/components/ui/badge";
import { cn } from "@/ui/utils";

import { formatCommentDate } from "../lib/format";
import { getCommentStatusBadge } from "../lib/status";
import type { CommentThreadStatus } from "../types";
import { getFeedbackKindBadge } from "@/lib/constants/feedback-kind";
import type { FeedbackKind } from "@/lib/contracts/databasev2";

export function CommentThreadListCard({
  authorName,
  authorRoleLabel,
  authorLguLabel,
  authorScopeLabel,
  updatedAt,
  kind,
  status,
  contextTitle,
  contextSubtitle,
  snippet,
  variant = "standalone",
  className,
}: {
  authorName: string;
  authorRoleLabel?: string | null;
  authorLguLabel?: string | null;
  // Backward compatibility. Prefer authorLguLabel.
  authorScopeLabel?: string | null;
  updatedAt: string | Date;
  kind: FeedbackKind;
  status: CommentThreadStatus;
  contextTitle: string;
  contextSubtitle: string;
  snippet: string;
  variant?: "standalone" | "embedded";
  className?: string;
}) {
  const safeAuthorName = authorName.trim() || "Citizen";
  const safeRoleLabel = authorRoleLabel?.trim() || "Citizen";
  const safeLguLabel = authorLguLabel?.trim() || authorScopeLabel?.trim() || "Brgy. Unknown";
  const initial = safeAuthorName.charAt(0).toUpperCase() || "C";
  const badge = getCommentStatusBadge(status);
  const kindBadge = getFeedbackKindBadge(kind);

  const content = (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-4">
        <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
          {initial}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {safeAuthorName}
            </p>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {safeRoleLabel} | {safeLguLabel}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Commented on:</span>{" "}
            <span className="text-slate-600">
              {contextTitle} • {contextSubtitle}
            </span>
          </p>

          <p className="mt-2 text-xs leading-relaxed text-slate-700">
            {snippet}
          </p>

          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
            <time dateTime={new Date(updatedAt).toISOString()}>
              {formatCommentDate(updatedAt)}
            </time>
            <span className="text-slate-300">•</span>
            <Badge
              variant="outline"
              className={cn("rounded-full px-2.5 py-0 text-[10px] font-medium", badge.className)}
            >
              {badge.label}
            </Badge>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700">Reply</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <Badge
          variant="outline"
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            kindBadge.className
          )}
        >
          {kindBadge.label}
        </Badge>
      </div>
    </div>
  );

  if (variant === "embedded") {
    return content;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm",
        className
      )}
    >
      {content}
    </div>
  );
}
