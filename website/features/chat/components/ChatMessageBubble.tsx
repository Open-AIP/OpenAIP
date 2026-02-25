"use client";

import { formatMatchMetric } from "@/lib/chat/match-metric";
import { cn } from "@/ui/utils";
import type { ChatMessageBubble as ChatMessageBubbleType } from "../types/chat.types";

export default function ChatMessageBubble({
  message,
}: {
  message: ChatMessageBubbleType;
}) {
  const isUser = message.role === "user";
  const resolvedStatus =
    message.retrievalMeta?.status ??
    (message.retrievalMeta?.refused ? "refusal" : "answer");

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-130 rounded-xl px-4 py-3 text-[13.5px] leading-relaxed",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        )}
      >
        <div className="whitespace-pre-line">{message.content}</div>

        {!isUser && resolvedStatus === "clarification" && (
          <div className="mt-2 rounded-md border border-sky-300/60 bg-sky-50 px-2 py-1 text-[11px] text-sky-900">
            Clarification needed.
          </div>
        )}

        {!isUser && resolvedStatus === "refusal" && (
          <div className="mt-2 rounded-md border border-amber-300/60 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
            Grounded refusal: insufficient or unverified evidence.
          </div>
        )}

        {!isUser && message.citations.length > 0 && (
          <div className="mt-3 space-y-2 border-t pt-2">
            {message.citations.map((citation) => {
              const metric = formatMatchMetric({
                distance: citation.distance,
                matchScore: citation.matchScore,
                similarity: citation.similarity,
              });

              return (
                <div key={`${message.id}:${citation.sourceId}:${citation.chunkId ?? "chunk"}`} className="rounded-md border bg-background px-2 py-1.5">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  <span>{citation.sourceId}</span>
                  <span>{citation.scopeName ?? "Unknown scope"}</span>
                  <span>{citation.scopeType ?? "unknown"}</span>
                  {typeof citation.fiscalYear === "number" && <span>FY {citation.fiscalYear}</span>}
                  {metric.label && metric.value ? <span>{metric.label} {metric.value}</span> : null}
                </div>
                <div className="mt-1 text-[12px] leading-snug">{citation.snippet}</div>
              </div>
              );
            })}
          </div>
        )}

        <div
          className={cn(
            "mt-2 text-[11px]",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {message.timeLabel}
        </div>
      </div>
    </div>
  );
}
