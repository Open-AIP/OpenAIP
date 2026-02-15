"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ChatMessageBubble from "./ChatMessageBubble";
import type { ChatMessageBubble as ChatMessageBubbleType } from "../types/chat.types";

export default function ChatThreadPanel({
  title,
  messages,
  messageInput,
  onMessageChange,
  onSend,
  threadRef,
  isSending,
}: {
  title: string;
  messages: ChatMessageBubbleType[];
  messageInput: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  threadRef: React.RefObject<HTMLDivElement | null>;
  isSending: boolean;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4 text-base font-semibold text-slate-900">
        {title}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}
          {!messages.length && (
            <div className="text-sm text-slate-500">Start a conversation.</div>
          )}
          <div ref={threadRef} />
        </div>
      </div>

      <div className="border-t border-slate-200 px-6 py-4">
        <div className="flex items-end gap-3">
          <Textarea
            value={messageInput}
            onChange={(event) => onMessageChange(event.target.value)}
            placeholder="Type a message..."
            className="min-h-[44px] resize-none border-slate-200 bg-slate-50 text-[13.5px]"
          />
          <Button
            className="h-10 gap-2 rounded-lg bg-[#0f5b66] px-4 text-xs hover:bg-[#0f5b66]/90"
            onClick={onSend}
            disabled={!messageInput.trim() || isSending}
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
