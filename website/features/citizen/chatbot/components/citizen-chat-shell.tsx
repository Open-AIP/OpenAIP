import type { RefObject } from "react";
import type { Json } from "@/lib/contracts/databasev2";
import type { CitizenChatErrorState as ChatErrorState, CitizenChatMessageVM, CitizenChatScopeChip, CitizenChatSessionVM } from "../types/citizen-chatbot.types";
import CitizenChatComposer from "./citizen-chat-composer";
import CitizenChatErrorState from "./citizen-chat-error-state";
import CitizenChatHeader from "./citizen-chat-header";
import CitizenChatMessageList from "./citizen-chat-message-list";
import CitizenChatSidebar from "./citizen-chat-sidebar";

export default function CitizenChatShell({
  activeContext,
  errorMessage,
  errorState,
  exampleQueries,
  isBootstrapping,
  isSending,
  messageInput,
  messages,
  query,
  scopeChips,
  sessionItems,
  sourcesEnabled,
  threadRef,
  onMessageInputChange,
  onNewChat,
  onQueryChange,
  onSelectSession,
  onSend,
  onToggleSources,
  onUseExample,
  onUseFollowUp,
}: {
  activeContext: Json;
  errorMessage: string | null;
  errorState: ChatErrorState;
  exampleQueries: readonly string[];
  isBootstrapping: boolean;
  isSending: boolean;
  messageInput: string;
  messages: CitizenChatMessageVM[];
  query: string;
  scopeChips: CitizenChatScopeChip[];
  sessionItems: CitizenChatSessionVM[];
  sourcesEnabled: boolean;
  threadRef: RefObject<HTMLDivElement | null>;
  onMessageInputChange: (value: string) => void;
  onNewChat: () => void;
  onQueryChange: (value: string) => void;
  onSelectSession: (id: string) => void;
  onSend: () => void;
  onToggleSources: (value: boolean) => void;
  onUseExample: (value: string) => void;
  onUseFollowUp: (value: string) => void;
}) {
  void activeContext;

  return (
    <section className="grid min-h-0 h-full grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <CitizenChatSidebar
        query={query}
        sessions={sessionItems}
        onQueryChange={onQueryChange}
        onNewChat={onNewChat}
        onSelectSession={onSelectSession}
      />

      <div className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-[#E9EEF2] shadow-sm">
        <CitizenChatHeader
          scopeChips={scopeChips}
          sourcesEnabled={sourcesEnabled}
          onToggleSources={onToggleSources}
        />

        {isBootstrapping ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-6">
            <p className="text-sm text-slate-500">Loading your conversations...</p>
          </div>
        ) : (
          <>
            {errorState !== "none" ? (
              <div className="px-6 pt-4">
                <CitizenChatErrorState state={errorState} message={errorMessage} onRetry={onSend} />
              </div>
            ) : null}

            <CitizenChatMessageList
              messages={messages}
              isSending={isSending}
              exampleQueries={exampleQueries}
              onUseExample={onUseExample}
              onUseFollowUp={onUseFollowUp}
              threadRef={threadRef}
            />
          </>
        )}

        <CitizenChatComposer
          value={messageInput}
          onChange={onMessageInputChange}
          onSend={onSend}
          disabled={isSending || errorState === "auth_required"}
        />
      </div>
    </section>
  );
}
