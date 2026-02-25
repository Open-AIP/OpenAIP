import { cn } from "@/ui/utils";
import type { CitizenChatMessageVM } from "../types/citizen-chatbot.types";
import CitizenChatEvidence from "./citizen-chat-evidence";
import CitizenChatFollowups from "./citizen-chat-followups";

export default function CitizenChatMessageBubble({
  message,
  onUseFollowUp,
}: {
  message: CitizenChatMessageVM;
  onUseFollowUp: (value: string) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[72%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser
            ? "bg-[#022437] text-white"
            : "border border-slate-200 bg-white text-slate-800"
        )}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        <p className={cn("mt-2 text-[11px]", isUser ? "text-white/70" : "text-slate-500")}>{message.timeLabel}</p>

        {!isUser ? (
          <>
            <CitizenChatEvidence evidence={message.evidence} />
            <CitizenChatFollowups followUps={message.followUps} onUseFollowUp={onUseFollowUp} />
          </>
        ) : null}
      </div>
    </div>
  );
}
