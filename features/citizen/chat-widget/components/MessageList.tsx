import type { RefObject } from "react";
import type { ChatMessageVM } from "@/lib/types/viewmodels";
import MessageBubble from "./MessageBubble";

export default function MessageList({
  messages,
  isTyping,
  threadRef,
}: {
  messages: ChatMessageVM[];
  isTyping: boolean;
  threadRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="space-y-3 px-4 py-3">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {!messages.length && (
        <div className="text-xs text-slate-500">Start a conversation.</div>
      )}
      {isTyping ? (
        <div className="text-xs text-slate-400">Assistant is typing...</div>
      ) : null}
      <div ref={threadRef} />
    </div>
  );
}
