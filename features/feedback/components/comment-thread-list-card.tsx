import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { formatCommentDate } from "../lib/format";
import { getCommentStatusBadge } from "../lib/status";
import type { CommentThreadStatus } from "../types";

export function CommentThreadListCard({
  authorName,
  authorScopeLabel,
  updatedAt,
  status,
  contextTitle,
  contextSubtitle,
  snippet,
  className,
}: {
  authorName: string;
  authorScopeLabel?: string | null;
  updatedAt: string | Date;
  status: CommentThreadStatus;
  contextTitle: string;
  contextSubtitle: string;
  snippet: string;
  className?: string;
}) {
  const safeAuthorName = authorName.trim() || "Citizen";
  const initial = safeAuthorName.charAt(0).toUpperCase() || "C";
  const badge = getCommentStatusBadge(status);

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm",
        className
      )}
    >
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
              {authorScopeLabel ? (
                <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                  {authorScopeLabel}
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">
                Commented on:
              </span>{" "}
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
              <span className="font-semibold text-slate-700">Reply</span>
            </div>
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
            badge.className
          )}
        >
          {badge.label}
        </Badge>
      </div>
    </div>
  );
}

