"use client";

import { useEffect, useMemo, useRef } from "react";
import CitizenChatShell from "../components/citizen-chat-shell";
import { useCitizenChatbot } from "../hooks/use-citizen-chatbot";

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
    setMessageInput,
    setQuery,
    handleNewChat,
    handleSelectSession,
    handleSend,
    handleUseExample,
    handleUseFollowUp,
  } = useCitizenChatbot();

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
      sessionItems={sessionItems}
      threadRef={threadRef}
      onMessageInputChange={setMessageInput}
      onNewChat={handleNewChat}
      onQueryChange={setQuery}
      onSelectSession={handleSelectSession}
      onSend={handleSend}
      onUseExample={handleUseExample}
      onUseFollowUp={handleUseFollowUp}
    />
  );
}
