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
