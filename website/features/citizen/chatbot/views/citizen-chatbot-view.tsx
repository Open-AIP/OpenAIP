"use client";

import { useEffect, useMemo, useRef } from "react";
import CitizenChatShell from "../components/citizen-chat-shell";
import { useCitizenChatbot } from "../hooks/use-citizen-chatbot";

export default function CitizenChatbotView() {
  const {
    activeSession,
    canManageConversations,
    composerMode,
    composerPlaceholder,
    errorMessage,
    errorState,
    exampleQueries,
    isBootstrapping,
    isComposerDisabled,
    isSending,
    messageInput,
    messages,
    query,
    sessionItems,
    setMessageInput,
    setQuery,
    handleComposerPrimaryAction,
    handleDeleteSession,
    handleNewChat,
    handleRenameSession,
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
      canManageConversations={canManageConversations}
      composerMode={composerMode}
      composerPlaceholder={composerPlaceholder}
      errorMessage={errorMessage}
      errorState={errorState}
      exampleQueries={stableExamples}
      isBootstrapping={isBootstrapping}
      isComposerDisabled={isComposerDisabled}
      isSending={isSending}
      messageInput={messageInput}
      messages={messages}
      query={query}
      sessionItems={sessionItems}
      threadRef={threadRef}
      onComposerPrimaryAction={handleComposerPrimaryAction}
      onDeleteSession={handleDeleteSession}
      onMessageInputChange={setMessageInput}
      onNewChat={handleNewChat}
      onQueryChange={setQuery}
      onRenameSession={handleRenameSession}
      onSelectSession={handleSelectSession}
      onSend={handleSend}
      onUseExample={handleUseExample}
      onUseFollowUp={handleUseFollowUp}
    />
  );
}
