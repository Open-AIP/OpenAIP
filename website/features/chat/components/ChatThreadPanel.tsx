"use client";

import type { RefObject } from "react";
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
  threadRef: RefObject<HTMLDivElement | null>;
  isSending: boolean;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border bg-card shadow-sm">
      <div className="shrink-0 border-b px-6 py-4 text-base font-semibold">{title}</div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}

          {!messages.length && (
            <div className="text-muted-foreground text-sm">Start a conversation.</div>
          )}

          <div ref={threadRef} />
        </div>
      </div>

      <div className="shrink-0 border-t px-6 py-4">
        <div className="flex items-end gap-3">
          <Textarea
            value={messageInput}
            onChange={(event) => onMessageChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder="Type a message..."
            className="min-h-11 max-h-32 resize-none overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[13.5px]"
          />
          <Button
            className="h-10 gap-2 rounded-lg px-4 text-xs"
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
