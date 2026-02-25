"use client";

import { cn } from "@/ui/utils";
import type { ChatMessageBubble as ChatMessageBubbleType } from "../types/chat.types";

export default function ChatMessageBubble({
  message,
}: {
  message: ChatMessageBubbleType;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-130 rounded-xl px-4 py-3 text-[13.5px] leading-relaxed",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        )}
      >
        <div className="whitespace-pre-line">{message.content}</div>

        {!isUser && message.retrievalMeta?.refused && (
          <div className="mt-2 rounded-md border border-amber-300/60 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
            Grounded refusal: insufficient or unverified evidence.
          </div>
        )}

        {!isUser && message.citations.length > 0 && (
          <div className="mt-3 space-y-2 border-t pt-2">
            {message.citations.map((citation) => (
              <div key={`${message.id}:${citation.sourceId}:${citation.chunkId ?? "chunk"}`} className="rounded-md border bg-background px-2 py-1.5">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  <span>{citation.sourceId}</span>
                  <span>{citation.scopeName ?? "Unknown scope"}</span>
                  <span>{citation.scopeType ?? "unknown"}</span>
                  {typeof citation.fiscalYear === "number" && <span>FY {citation.fiscalYear}</span>}
                  {typeof citation.distance === "number" ? (
                    <span>DIST {citation.distance.toFixed(3)}</span>
                  ) : typeof citation.matchScore === "number" ? (
                    <span>MATCH {(citation.matchScore * 100).toFixed(1)}%</span>
                  ) : typeof citation.similarity === "number" ? (
                    <span>MATCH {(citation.similarity * 100).toFixed(1)}%</span>
                  ) : null}
                </div>
                <div className="mt-1 text-[12px] leading-snug">{citation.snippet}</div>
              </div>
            ))}
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
