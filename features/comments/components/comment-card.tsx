import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquareText, UserRound } from "lucide-react";

import type { CommentCardProps } from "../types";
import { formatCommentDate } from "../lib/format";
import { getCommentStatusBadge } from "../lib/status";

export function CommentCard(props: CommentCardProps) {
  const {
    commenterName,
    barangayName,
    createdAt,
    projectLabel,
    comment,
    status,
    response,
    actionLabel,
    onAction,
    className,
    showActions = true,
  } = props;

  const dateText = formatCommentDate(createdAt);
  const badge = getCommentStatusBadge(status);

  return (
    <Card
      className={cn(
        "rounded-2xl border-slate-200 bg-white shadow-sm px-6 py-5",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 grid h-11 w-11 place-items-center rounded-full bg-slate-100 ring-1 ring-slate-200">
          <UserRound className="h-5 w-5 text-slate-600" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-semibold text-slate-900">
                  {commenterName}
                </p>

                {(barangayName || dateText) && (
                  <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {barangayName ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 ring-1 ring-slate-200">
                        {barangayName}
                      </span>
                    ) : null}

                    {dateText ? (
                      <>
                        <span className="text-slate-300">&bull;</span>
                        <time dateTime={new Date(createdAt).toISOString()}>
                          {dateText}
                        </time>
                      </>
                    ) : null}
                  </p>
                )}
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

          <p className="mt-3 text-sm text-slate-700">
            <span className="font-semibold text-slate-700">Commented on:</span>{" "}
            <span className="text-slate-600">{projectLabel}</span>
          </p>

          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {comment}
          </p>

          {response ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-200">
                  <UserRound className="h-4 w-4 text-slate-600" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {response.responderName}
                    </p>
                    {response.responderRoleLabel ? (
                      <span className="text-xs text-slate-500">
                        {response.responderRoleLabel}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm text-slate-700">
                    {response.message}
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    <time dateTime={new Date(response.createdAt).toISOString()}>
                      {formatCommentDate(response.createdAt)}
                    </time>
                    <button type="button" className="font-semibold text-slate-700">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {showActions && ((actionLabel && onAction) || status === "no_response") ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {actionLabel && onAction ? (
                <Button
                  type="button"
                  onClick={onAction}
                  className="rounded-xl"
                  size="sm"
                >
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  {actionLabel}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl"
                  size="sm"
                >
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  Reply
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
