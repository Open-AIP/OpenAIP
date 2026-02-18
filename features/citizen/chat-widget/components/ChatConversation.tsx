import type { RefObject } from "react";
import type { ChatComposerVM, ChatMessageVM } from "@/lib/types/viewmodels";
import MessageLimitIndicator from "./MessageLimitIndicator";
import MessageList from "./MessageList";
import ChatComposer from "./ChatComposer";

export default function ChatConversation({
  messages,
  messageCount,
  messageLimit,
  composer,
  onComposerChange,
  onSend,
  isSending,
  threadRef,
}: {
  messages: ChatMessageVM[];
  messageCount: number;
  messageLimit: number;
  composer: ChatComposerVM;
  onComposerChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  threadRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex h-full flex-col">
      <MessageLimitIndicator count={messageCount} limit={messageLimit} />
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} isTyping={isSending} threadRef={threadRef} />
      </div>
      <ChatComposer
        vm={composer}
        onChange={onComposerChange}
        onSend={onSend}
        disabled={isSending || messageCount >= messageLimit}
      />
    </div>
  );
}
