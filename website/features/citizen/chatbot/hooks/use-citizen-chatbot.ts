"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { getCitizenChatRepo } from "@/lib/repos/citizen-chat/repo";
import type { CitizenChatMessage, CitizenChatSession } from "@/lib/repos/citizen-chat/repo";
import { CITIZEN_CHAT_LIMITS } from "../constants/ui";
import { mapEvidenceFromCitations, mapFollowUpsFromRetrievalMeta } from "../mappers/chat-message-presenter";
import type {
  CitizenChatErrorState,
  CitizenChatMessageVM,
  CitizenChatReplyResult,
  CitizenChatSessionVM,
} from "../types/citizen-chatbot.types";

const EXAMPLE_QUERIES = [
  "What is the total budget for FY 2025?",
  "Show Social Services allocation trends from 2020-2026.",
  "List infrastructure projects in my barangay.",
] as const;

function formatTimeLabel(value: string | null | undefined) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function toSessionItem(params: {
  session: CitizenChatSession;
  messages: CitizenChatMessage[];
  isActive: boolean;
}): CitizenChatSessionVM {
  const { session, messages, isActive } = params;
  const lastMessage = messages[messages.length - 1] ?? null;

  return {
    id: session.id,
    title: session.title?.trim() || "New chat",
    snippet: lastMessage?.content?.trim() || "No messages yet.",
    timeLabel: formatTimeLabel(lastMessage?.createdAt ?? session.lastMessageAt ?? session.updatedAt),
    scopeBadge: "Scope: Citizen",
    isActive,
  };
}

function toMessageVm(message: CitizenChatMessage): CitizenChatMessageVM {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timeLabel: formatTimeLabel(message.createdAt),
    citations: message.citations,
    retrievalMeta: message.retrievalMeta,
    evidence: mapEvidenceFromCitations(message.citations),
    followUps: mapFollowUpsFromRetrievalMeta(message.retrievalMeta),
  };
}

async function requestAssistantReply(params: {
  sessionId: string;
  userMessage: string;
}): Promise<CitizenChatReplyResult> {
  const response = await fetch("/api/citizen/chat/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: params.sessionId,
      user_message: params.userMessage,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as
    | CitizenChatReplyResult
    | { error?: string };

  if (!response.ok) {
    const error = "error" in payload && typeof payload.error === "string"
      ? payload.error
      : "Failed to fetch assistant response.";
    throw new Error(error);
  }

  return payload as CitizenChatReplyResult;
}

export function useCitizenChatbot() {
  const repo = useMemo(() => getCitizenChatRepo(), []);
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<CitizenChatSession[]>([]);
  const [messagesBySession, setMessagesBySession] = useState<Record<string, CitizenChatMessage[]>>({});
  const [loadedSessionIds, setLoadedSessionIds] = useState<Record<string, true>>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [errorState, setErrorState] = useState<CitizenChatErrorState>("none");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function resolveUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;

      if (error || !data.user?.id) {
        setUserId(null);
        setErrorState("auth_required");
        setErrorMessage("Sign in to use the Citizen AI Assistant.");
        setIsBootstrapping(false);
        return;
      }

      setUserId(data.user.id);
      setErrorState("none");
      setErrorMessage(null);
    }

    resolveUser();

    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    let active = true;
    if (!userId) return;

    async function bootstrapSessions() {
      setIsBootstrapping(true);
      try {
        const list = await repo.listSessions(userId);
        if (!active) return;

        if (list.length === 0) {
          const created = await repo.createSession(userId, { context: {} });
          if (!active) return;

          setSessions([created]);
          setActiveSessionId(created.id);
          setMessagesBySession((prev) => ({ ...prev, [created.id]: [] }));
          setLoadedSessionIds((prev) => ({ ...prev, [created.id]: true }));
        } else {
          setSessions(list);
          setActiveSessionId((current) => current ?? list[0]?.id ?? null);
        }
        setErrorState("none");
        setErrorMessage(null);
      } catch (error) {
        if (!active) return;
        setErrorState("retrieval_failed");
        setErrorMessage(error instanceof Error ? error.message : "Failed to load sessions.");
      } finally {
        if (active) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrapSessions();

    return () => {
      active = false;
    };
  }, [repo, userId]);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      if (!activeSessionId || loadedSessionIds[activeSessionId]) return;
      try {
        const messages = await repo.listMessages(activeSessionId);
        if (!active) return;

        setMessagesBySession((prev) => ({
          ...prev,
          [activeSessionId]: messages,
        }));
        setLoadedSessionIds((prev) => ({
          ...prev,
          [activeSessionId]: true,
        }));
      } catch (error) {
        if (!active) return;
        setErrorState("retrieval_failed");
        setErrorMessage(error instanceof Error ? error.message : "Failed to load messages.");
      }
    }

    loadMessages();

    return () => {
      active = false;
    };
  }, [activeSessionId, loadedSessionIds, repo]);

  const sessionItems = useMemo(() => {
    const lowered = query.trim().toLowerCase();

    return sessions
      .map((session) =>
        toSessionItem({
          session,
          messages: messagesBySession[session.id] ?? [],
          isActive: session.id === activeSessionId,
        })
      )
      .filter((session) => {
        if (!lowered) return true;
        return (
          session.title.toLowerCase().includes(lowered) ||
          session.snippet.toLowerCase().includes(lowered) ||
          session.scopeBadge.toLowerCase().includes(lowered)
        );
      });
  }, [activeSessionId, messagesBySession, query, sessions]);

  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;

  const messages = useMemo(() => {
    const activeMessages = activeSessionId ? messagesBySession[activeSessionId] ?? [] : [];
    return activeMessages.map(toMessageVm);
  }, [activeSessionId, messagesBySession]);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const handleNewChat = useCallback(async () => {
    if (!userId) return;

    try {
      const session = await repo.createSession(userId, { context: {} });
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessagesBySession((prev) => ({ ...prev, [session.id]: [] }));
      setLoadedSessionIds((prev) => ({ ...prev, [session.id]: true }));
      setErrorState("none");
      setErrorMessage(null);
    } catch (error) {
      setErrorState("retrieval_failed");
      setErrorMessage(error instanceof Error ? error.message : "Failed to start a new chat.");
    }
  }, [repo, userId]);

  const handleUseExample = useCallback((value: string) => {
    setMessageInput(value);
  }, []);

  const handleUseFollowUp = useCallback((value: string) => {
    setMessageInput(value);
  }, []);

  const handleSend = useCallback(async () => {
    const content = messageInput.trim();
    if (!content || !userId) return;
    if (content.length > CITIZEN_CHAT_LIMITS.contentMaxLength) {
      setErrorState("retrieval_failed");
      setErrorMessage(`Message must be ${CITIZEN_CHAT_LIMITS.contentMaxLength} characters or less.`);
      return;
    }

    setIsSending(true);
    setErrorState("none");
    setErrorMessage(null);

    let sessionId = activeSessionId;
    if (!sessionId) {
      const created = await repo.createSession(userId, { context: {} });
      setSessions((prev) => [created, ...prev]);
      setActiveSessionId(created.id);
      setMessagesBySession((prev) => ({ ...prev, [created.id]: [] }));
      setLoadedSessionIds((prev) => ({ ...prev, [created.id]: true }));
      sessionId = created.id;
    }

    const optimisticId = `temp_user_${Date.now()}`;
    const optimisticMessage: CitizenChatMessage = {
      id: optimisticId,
      sessionId,
      role: "user",
      content,
      citations: null,
      retrievalMeta: null,
      createdAt: new Date().toISOString(),
    };

    setMessageInput("");
    setMessagesBySession((prev) => ({
      ...prev,
      [sessionId]: [...(prev[sessionId] ?? []), optimisticMessage],
    }));

    try {
      const persistedUser = await repo.appendUserMessage(sessionId, content);

      setMessagesBySession((prev) => ({
        ...prev,
        [sessionId]: (prev[sessionId] ?? []).map((msg) =>
          msg.id === optimisticId ? persistedUser : msg
        ),
      }));

      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                lastMessageAt: persistedUser.createdAt,
                updatedAt: persistedUser.createdAt,
              }
            : session
        )
      );

      const reply = await requestAssistantReply({
        sessionId,
        userMessage: content,
      });

      const assistantMessage: CitizenChatMessage = {
        id: reply.message.id,
        sessionId: reply.message.sessionId,
        role: "assistant",
        content: reply.message.content,
        citations: reply.message.citations,
        retrievalMeta: {
          ...(reply.message.retrievalMeta && typeof reply.message.retrievalMeta === "object" && !Array.isArray(reply.message.retrievalMeta)
            ? reply.message.retrievalMeta
            : {}),
          suggestedFollowUps: reply.suggestedFollowUps,
        },
        createdAt: reply.message.createdAt,
      };

      setMessagesBySession((prev) => ({
        ...prev,
        [sessionId]: [...(prev[sessionId] ?? []), assistantMessage],
      }));

      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                lastMessageAt: assistantMessage.createdAt,
                updatedAt: assistantMessage.createdAt,
              }
            : session
        )
      );
    } catch (error) {
      setMessagesBySession((prev) => ({
        ...prev,
        [sessionId]: (prev[sessionId] ?? []).filter((msg) => msg.id !== optimisticId),
      }));

      const message = error instanceof Error ? error.message : "Failed to retrieve assistant response.";
      if (message.toLowerCase().includes("published aip")) {
        setErrorState("no_published_aip");
      } else {
        setErrorState("retrieval_failed");
      }
      setErrorMessage(message);
    } finally {
      setIsSending(false);
    }
  }, [activeSessionId, messageInput, repo, userId]);

  return {
    activeSession,
    activeSessionId,
    errorMessage,
    errorState,
    exampleQueries: EXAMPLE_QUERIES,
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
  };
}
