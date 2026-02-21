"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CHAT_DEFAULT_USER_ID } from "@/lib/constants/chat";
import { getChatRepo } from "@/lib/repos/chat/repo";
import type { ChatMessage, ChatSession } from "@/lib/repos/chat/repo";
import type { ChatMessageBubble, ChatSessionListItem } from "../types/chat.types";

function formatTimeLabel(value: string | null | undefined) {
  if (!value) return "Just now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function toSessionListItem(params: {
  session: ChatSession;
  messages: ChatMessage[];
  isActive: boolean;
}): ChatSessionListItem {
  const { session, messages, isActive } = params;
  const lastMessage = messages[messages.length - 1] ?? null;

  return {
    id: session.id,
    title: session.title?.trim() || "New chat",
    snippet: lastMessage?.content?.trim() || "No messages yet.",
    timeLabel: formatTimeLabel(lastMessage?.createdAt ?? session.lastMessageAt ?? session.updatedAt),
    isActive,
  };
}

function toBubble(message: ChatMessage): ChatMessageBubble {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timeLabel: formatTimeLabel(message.createdAt),
  };
}

function buildAssistantReply(content: string): string {
  if (content.toLowerCase().includes("budget")) {
    return (
      "For AIP budgeting, prioritize by outcomes and urgency.\n\n" +
      "1. Essential services first\n" +
      "2. Compliance and legal requirements\n" +
      "3. High-impact community projects\n" +
      "4. Contingency and sustainability\n\n" +
      "Share your project category and I can suggest a draft allocation structure."
    );
  }

  return "Thanks. I can help with AIP drafting, project scope, and compliance checks. What would you like to work on next?";
}

export function useLguChatbot(userId?: string) {
  const repo = useMemo(() => getChatRepo(), []);
  const actorUserId = userId ?? CHAT_DEFAULT_USER_ID;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>({});
  const [loadedSessionIds, setLoadedSessionIds] = useState<Record<string, true>>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      const data = await repo.listSessions(actorUserId);
      if (!isMounted) return;
      setSessions(data);
      setActiveSessionId((prev) => prev ?? data[0]?.id ?? null);
    }

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, [actorUserId, repo]);

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      if (!activeSessionId || loadedSessionIds[activeSessionId]) {
        return;
      }

      const data = await repo.listMessages(activeSessionId);
      if (!isMounted) return;

      setMessagesBySession((prev) => ({
        ...prev,
        [activeSessionId]: data,
      }));
      setLoadedSessionIds((prev) => ({
        ...prev,
        [activeSessionId]: true,
      }));
    }

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [activeSessionId, loadedSessionIds, repo]);

  const sessionListItems = useMemo<ChatSessionListItem[]>(() => {
    const lowered = query.trim().toLowerCase();

    return sessions
      .map((session) =>
        toSessionListItem({
          session,
          messages: messagesBySession[session.id] ?? [],
          isActive: session.id === activeSessionId,
        })
      )
      .filter((session) => {
        if (!lowered) return true;
        return (
          session.title.toLowerCase().includes(lowered) ||
          session.snippet.toLowerCase().includes(lowered)
        );
      });
  }, [activeSessionId, messagesBySession, query, sessions]);

  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;
  const activeMessages = activeSessionId ? messagesBySession[activeSessionId] ?? [] : [];
  const bubbles = activeMessages.map(toBubble);

  const handleSelect = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const handleNewChat = useCallback(async () => {
    const session = await repo.createSession(actorUserId);
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    setMessagesBySession((prev) => ({ ...prev, [session.id]: [] }));
    setLoadedSessionIds((prev) => ({ ...prev, [session.id]: true }));
  }, [actorUserId, repo]);

  const handleSend = useCallback(async () => {
    if (!messageInput.trim()) return;

    setIsSending(true);
    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
      const newSession = await repo.createSession(actorUserId);
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setLoadedSessionIds((prev) => ({ ...prev, [newSession.id]: true }));
      currentSessionId = newSession.id;
    }

    const content = messageInput.trim();
    setMessageInput("");

    const userMessage = await repo.appendUserMessage(currentSessionId, content);

    setMessagesBySession((prev) => ({
      ...prev,
      [currentSessionId]: [...(prev[currentSessionId] ?? []), userMessage],
    }));

    setSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId
          ? {
              ...session,
              lastMessageAt: userMessage.createdAt,
              updatedAt: userMessage.createdAt,
            }
          : session
      )
    );

    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        sessionId: currentSessionId,
        role: "assistant",
        content: buildAssistantReply(content),
        createdAt: new Date().toISOString(),
      };

      setMessagesBySession((prev) => ({
        ...prev,
        [currentSessionId]: [...(prev[currentSessionId] ?? []), assistantMessage],
      }));
      setIsSending(false);
    }, 500);
  }, [activeSessionId, actorUserId, messageInput, repo]);

  return {
    activeSessionId,
    query,
    messageInput,
    isSending,
    sessionListItems,
    activeSession,
    bubbles,
    setQuery,
    setMessageInput,
    handleSelect,
    handleNewChat,
    handleSend,
  };
}
