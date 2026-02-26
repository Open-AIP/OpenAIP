"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatMessage, ChatSession } from "@/lib/repos/chat/repo";
import type { ChatCitation, ChatRetrievalMeta } from "@/lib/repos/chat/types";
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
    citations: (message.citations as ChatCitation[] | null) ?? [],
    retrievalMeta: (message.retrievalMeta as ChatRetrievalMeta | null) ?? null,
  };
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : "Request failed.";
    throw new Error(message);
  }
  return payload as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : "Request failed.";
    throw new Error(message);
  }
  return payload as T;
}

export function useLguChatbot() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>({});
  const [loadedSessionIds, setLoadedSessionIds] = useState<Record<string, true>>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    const payload = await getJson<{ sessions: ChatSession[] }>("/api/barangay/chat/sessions");
    setSessions(payload.sessions ?? []);
    setActiveSessionId((prev) => prev ?? payload.sessions?.[0]?.id ?? null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    loadSessions().catch((err) => {
      if (!isMounted) return;
      setError(err instanceof Error ? err.message : "Failed to load chat sessions.");
    });

    return () => {
      isMounted = false;
    };
  }, [loadSessions]);

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      if (!activeSessionId || loadedSessionIds[activeSessionId]) return;

      const payload = await getJson<{ messages: ChatMessage[] }>(
        `/api/barangay/chat/sessions/${activeSessionId}/messages`
      );
      if (!isMounted) return;

      setMessagesBySession((prev) => ({
        ...prev,
        [activeSessionId]: payload.messages ?? [],
      }));
      setLoadedSessionIds((prev) => ({
        ...prev,
        [activeSessionId]: true,
      }));
    }

    loadMessages().catch((err) => {
      if (!isMounted) return;
      setError(err instanceof Error ? err.message : "Failed to load messages.");
    });

    return () => {
      isMounted = false;
    };
  }, [activeSessionId, loadedSessionIds]);

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
    setError(null);
  }, []);

  const handleNewChat = useCallback(async () => {
    setError(null);
    try {
      const payload = await postJson<{ session: ChatSession }>("/api/barangay/chat/sessions", {});
      const session = payload.session;
      if (!session) return;
      setSessions((prev) => [session, ...prev.filter((item) => item.id !== session.id)]);
      setActiveSessionId(session.id);
      setMessagesBySession((prev) => ({ ...prev, [session.id]: [] }));
      setLoadedSessionIds((prev) => ({ ...prev, [session.id]: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create chat.");
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!messageInput.trim() || isSending) return;
    setError(null);
    setIsSending(true);

    try {
      const content = messageInput.trim();
      setMessageInput("");

      const payload = await postJson<{
        sessionId: string;
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
      }>("/api/barangay/chat/messages", {
        sessionId: activeSessionId,
        content,
      });

      const resolvedSessionId = payload.sessionId;
      const userMessage = payload.userMessage;
      const assistantMessage = payload.assistantMessage;

      if (!resolvedSessionId || !userMessage || !assistantMessage) {
        throw new Error("Invalid chatbot response payload.");
      }

      setActiveSessionId(resolvedSessionId);
      setLoadedSessionIds((prev) => ({ ...prev, [resolvedSessionId]: true }));
      setMessagesBySession((prev) => ({
        ...prev,
        [resolvedSessionId]: [...(prev[resolvedSessionId] ?? []), userMessage, assistantMessage],
      }));

      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  }, [activeSessionId, isSending, loadSessions, messageInput]);

  return {
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
  };
}
