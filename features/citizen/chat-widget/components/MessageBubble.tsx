import type { ChatMessageVM } from "@/lib/types/viewmodels";
import { cn } from "@/ui/utils";
import MessageMeta from "./MessageMeta";

export default function MessageBubble({ message }: { message: ChatMessageVM }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[260px] rounded-xl px-3 py-2 text-[12px] leading-relaxed",
          isUser ? "bg-[#0b5164] text-white" : "bg-slate-100 text-slate-700"
        )}
      >
        <div className="whitespace-pre-line">{message.content}</div>
        <MessageMeta label={message.timestampDisplay} align={isUser ? "right" : "left"} />
      </div>
    </div>
  );
}
