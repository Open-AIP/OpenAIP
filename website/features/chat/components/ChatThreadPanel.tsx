"use client";

import type { RefObject } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ChatAssistantLoadingState from "./ChatAssistantLoadingState";
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
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm md:rounded-2xl">
      <div className="shrink-0 border-b px-4 py-3 text-sm font-semibold md:px-6 md:py-4 md:text-base">
        <div className="truncate">{title}</div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5">
        <div className="space-y-3 md:space-y-4">
          {messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}

          {isSending ? <ChatAssistantLoadingState /> : null}

          {!messages.length && !isSending && (
            <div className="text-muted-foreground text-sm">Start a conversation.</div>
          )}

          <div ref={threadRef} />
        </div>
      </div>

      <div
        data-testid="chat-thread-composer"
        className="sticky bottom-0 z-10 shrink-0 border-t bg-card px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:static md:px-6 md:py-4 md:pb-4"
      >
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
            className="min-h-10 max-h-32 resize-none overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[13px] md:min-h-11 md:text-[13.5px]"
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
