"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChatSessionsPanel from "../components/ChatSessionsPanel";
import ChatThreadPanel from "../components/ChatThreadPanel";
import {
  mapMessageToBubble,
  mapSessionToListItem,
} from "../mappers/chat.mapper";
import type { ChatMessageBubble, ChatSessionListItem } from "../types/chat.types";
import { getChatRepo } from "@/lib/repos/chat/repo";
import type { ChatMessage, ChatSession } from "@/lib/repos/chat/repo";
import { CHAT_DEFAULT_USER_ID } from "@/mocks/fixtures/chat/chat.fixture";

const buildAssistantReply = (content: string): string => {
  if (content.toLowerCase().includes("budget")) {
    return (
      "For health programs in your Annual Investment Plan, I recommend allocating the budget based on priority areas:\n\n" +
      "1. Preventive Health Services (40%) – Vaccination programs, health education, and community health initiatives\n" +
      "2. Primary Healthcare (30%) – Medical supplies, equipment, and basic healthcare services\n" +
      "3. Emergency Response (20%) – First aid kits, emergency medical services, and disaster health preparedness\n" +
      "4. Health Infrastructure (10%) – Maintenance and improvement of health centers\n\n" +
      "Would you like specific guidance on any of these categories?"
    );
  }

  return "Thanks for the update. I can help you review requirements, project status, or compliance workflows. What should we review next?";
};

export default function LguChatbotView() {
  const repo = useMemo(() => getChatRepo(), []);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      const data = await repo.listSessions(CHAT_DEFAULT_USER_ID);
      if (!isMounted) return;
      setSessions(data);
      if (data.length > 0) {
        setActiveSessionId(data[0].id);
      }
    }

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, [repo]);

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      if (!activeSessionId) return;
      const existing = messagesBySession[activeSessionId];
      if (existing) return;
      const data = await repo.listMessages(activeSessionId);
      if (!isMounted) return;
      setMessagesBySession((prev) => ({
        ...prev,
        [activeSessionId]: data,
      }));
    }

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [activeSessionId, messagesBySession, repo]);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeSessionId, messagesBySession]);

  const sessionListItems = useMemo<ChatSessionListItem[]>(() => {
    const lowered = query.trim().toLowerCase();
    return sessions
      .map((session) =>
        mapSessionToListItem({
          session,
          messages: messagesBySession[session.id] ?? [],
          isActive: session.id === activeSessionId,
        })
      )
      .filter((item) => {
        if (!lowered) return true;
        return (
          item.title.toLowerCase().includes(lowered) ||
          item.snippet.toLowerCase().includes(lowered)
        );
      });
  }, [sessions, messagesBySession, activeSessionId, query]);

  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;
  const activeMessages = activeSessionId ? messagesBySession[activeSessionId] ?? [] : [];
  const bubbles: ChatMessageBubble[] = activeMessages.map(mapMessageToBubble);

  const handleSelect = (id: string) => {
    setActiveSessionId(id);
  };

  const handleNewChat = async () => {
    const session = await repo.createSession(CHAT_DEFAULT_USER_ID);
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    setMessagesBySession((prev) => ({ ...prev, [session.id]: [] }));
  };

  const handleSend = async () => {
    if (!activeSessionId || !messageInput.trim()) return;
    setIsSending(true);
    const content = messageInput.trim();
    setMessageInput("");

    const userMessage = await repo.appendUserMessage(activeSessionId, content);
    setMessagesBySession((prev) => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] ?? []), userMessage],
    }));

    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? { ...session, lastMessageAt: userMessage.createdAt, updatedAt: userMessage.createdAt }
          : session
      )
    );

    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        sessionId: activeSessionId,
        role: "assistant",
        content: buildAssistantReply(content),
        createdAt: new Date().toISOString(),
      };
      setMessagesBySession((prev) => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] ?? []), assistantMessage],
      }));
      setIsSending(false);
    }, 500);
  };

  return (
    <div className="space-y-6 text-[13.5px] text-slate-700">
      <div className="space-y-2">
        <h1 className="text-[28px] font-semibold text-slate-900">Chatbot</h1>
        <p className="text-[14px] text-muted-foreground">
          Ask questions and get guided assistance related to the Annual Investment Program, projects, and compliance workflows.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
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
    </div>
  );
}
