"use client";

import { useEffect, useMemo, useRef } from "react";
import CitizenChatShell from "../components/citizen-chat-shell";
import { useCitizenChatbot } from "../hooks/use-citizen-chatbot";
import { useCitizenChatScope } from "../hooks/use-citizen-chat-scope";

export default function CitizenChatbotView() {
  const {
    activeSession,
    errorMessage,
    errorState,
    exampleQueries,
    isBootstrapping,
    isSending,
    messageInput,
    messages,
    query,
    sessionItems,
    sourcesEnabled,
    setMessageInput,
    setQuery,
    setSourcesEnabled,
    handleNewChat,
    handleSelectSession,
    handleSend,
    handleUseExample,
    handleUseFollowUp,
  } = useCitizenChatbot();

  const scopeChips = useCitizenChatScope(activeSession?.context ?? {});
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isSending]);

  const stableExamples = useMemo(() => exampleQueries, [exampleQueries]);

  return (
    <CitizenChatShell
      activeContext={activeSession?.context ?? {}}
      errorMessage={errorMessage}
      errorState={errorState}
      exampleQueries={stableExamples}
      isBootstrapping={isBootstrapping}
      isSending={isSending}
      messageInput={messageInput}
      messages={messages}
      query={query}
      scopeChips={scopeChips}
      sessionItems={sessionItems}
      sourcesEnabled={sourcesEnabled}
      threadRef={threadRef}
      onMessageInputChange={setMessageInput}
      onNewChat={handleNewChat}
      onQueryChange={setQuery}
      onSelectSession={handleSelectSession}
      onSend={handleSend}
      onToggleSources={setSourcesEnabled}
      onUseExample={handleUseExample}
      onUseFollowUp={handleUseFollowUp}
    />
  );
}
