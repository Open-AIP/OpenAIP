"use client";

import { useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ChatSessionsPanel from "../components/ChatSessionsPanel";
import ChatThreadPanel from "../components/ChatThreadPanel";
import { useLguChatbot } from "../hooks/use-lgu-chatbot";

export default function LguChatbotView() {
  const {
    activeSessionId,
    query,
    messageInput,
    isSending,
    error,
    sessionListItems,
    activeSession,
    bubbles,
    setQuery,
    setMessageInput,
    handleSelect,
    handleNewChat,
    handleSend,
  } = useLguChatbot();

  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeSessionId, bubbles.length]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 text-[13.5px]">
      <div className="space-y-2 shrink-0">
        <h1 className="text-[28px] font-semibold">Chatbot</h1>
        <p className="text-muted-foreground text-[14px]">
          Ask questions and get guided assistance related to the Annual Investment Program,
          projects, and compliance workflows.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <ChatSessionsPanel
          sessions={sessionListItems}
          query={query}
          onQueryChange={setQuery}
          onSelect={handleSelect}
          onNewChat={handleNewChat}
        />

        <ChatThreadPanel
          title={activeSession ? activeSession.title ?? "New Chat" : "Chatbot"}
          messages={bubbles}
          messageInput={messageInput}
          onMessageChange={setMessageInput}
          onSend={handleSend}
          threadRef={threadRef}
          isSending={isSending}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
