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
          "max-w-[520px] rounded-xl px-4 py-3 text-[13.5px] leading-relaxed",
          isUser
            ? "bg-[#0f5b66] text-white"
            : "bg-slate-100 text-slate-700"
        )}
      >
        <div className="whitespace-pre-line">{message.content}</div>
        <div className={cn("mt-2 text-[11px]", isUser ? "text-white/70" : "text-slate-400")}>
          {message.timeLabel}
        </div>
      </div>
    </div>
  );
}
