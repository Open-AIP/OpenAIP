import type { RefObject } from "react";
import CitizenChatLoadingMessage from "./citizen-chat-loading-message";
import CitizenChatMessageBubble from "./citizen-chat-message-bubble";
import CitizenChatWelcome from "./citizen-chat-welcome";
import type { CitizenChatMessageVM } from "../types/citizen-chatbot.types";

export default function CitizenChatMessageList({
  messages,
  isSending,
  exampleQueries,
  onUseExample,
  onUseFollowUp,
  threadRef,
}: {
  messages: CitizenChatMessageVM[];
  isSending: boolean;
  exampleQueries: readonly string[];
  onUseExample: (value: string) => void;
  onUseFollowUp: (value: string) => void;
  threadRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <div className="space-y-4">
        {!messages.length ? (
          <CitizenChatWelcome examples={exampleQueries} onUseExample={onUseExample} />
        ) : (
          messages.map((message) => (
            <CitizenChatMessageBubble key={message.id} message={message} onUseFollowUp={onUseFollowUp} />
          ))
        )}

        {isSending ? <CitizenChatLoadingMessage /> : null}

        <div ref={threadRef} />
      </div>
    </div>
  );
}
