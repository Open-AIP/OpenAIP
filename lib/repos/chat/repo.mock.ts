import {
  CHAT_MESSAGES_FIXTURE,
  CHAT_SESSIONS_FIXTURE,
} from "@/mocks/fixtures/chat/chat.fixture";
import type { ChatMessageRow, ChatSessionRow } from "@/lib/contracts/databasev2";
import type { ChatMessageRole } from "@/lib/contracts/databasev2";
import { ChatRepoErrors } from "./types";
import type { ChatMessage, ChatRepo, ChatSession } from "./repo";

// [DATAFLOW] Mock `ChatRepo` implementation backed by in-memory arrays.
// [DBV2] Supabase adapter should map sessions/messages to `public.chat_sessions`/`public.chat_messages` and keep messages append-only.

let sessionSequence = CHAT_SESSIONS_FIXTURE.length + 1;
let messageSequence = CHAT_MESSAGES_FIXTURE.length + 1;

const mapSessionRecord = (record: ChatSessionRow): ChatSession => ({
  id: record.id,
  userId: record.user_id,
  title: record.title,
  context: record.context,
  lastMessageAt: record.last_message_at,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

const mapMessageRecord = (record: ChatMessageRow): ChatMessage => ({
  id: record.id,
  sessionId: record.session_id,
  role: record.role,
  content: record.content,
  createdAt: record.created_at,
  citations: record.citations ?? null,
  retrievalMeta: record.retrieval_meta ?? null,
});

let sessionsStore: ChatSession[] = CHAT_SESSIONS_FIXTURE.map(mapSessionRecord);
let messagesStore: ChatMessage[] = CHAT_MESSAGES_FIXTURE.map(mapMessageRecord);

function nextSessionId() {
  const id = `chat_${String(sessionSequence).padStart(3, "0")}`;
  sessionSequence += 1;
  return id;
}

function nextMessageId() {
  const id = `cmsg_${String(messageSequence).padStart(4, "0")}`;
  messageSequence += 1;
  return id;
}

function sortByCreatedAtAsc(a: { createdAt: string }, b: { createdAt: string }) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export function __resetMockChatState() {
  sessionSequence = CHAT_SESSIONS_FIXTURE.length + 1;
  messageSequence = CHAT_MESSAGES_FIXTURE.length + 1;
  sessionsStore = CHAT_SESSIONS_FIXTURE.map(mapSessionRecord);
  messagesStore = CHAT_MESSAGES_FIXTURE.map(mapMessageRecord);
}

export function createMockChatRepo(): ChatRepo {
  return {
    async listSessions(userId: string): Promise<ChatSession[]> {
      return sessionsStore
        .filter((session) => session.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    },

    async getSession(sessionId: string): Promise<ChatSession | null> {
      return sessionsStore.find((session) => session.id === sessionId) ?? null;
    },

    async createSession(
      userId: string,
      payload?: { title?: string; context?: unknown }
    ): Promise<ChatSession> {
      const now = new Date().toISOString();
      const session: ChatSession = {
        id: nextSessionId(),
        userId,
        title: payload?.title ?? null,
        context: payload?.context ?? null,
        lastMessageAt: null,
        createdAt: now,
        updatedAt: now,
      };

      sessionsStore = [...sessionsStore, session];
      return session;
    },

    async renameSession(sessionId: string, title: string): Promise<ChatSession | null> {
      const index = sessionsStore.findIndex((session) => session.id === sessionId);
      if (index === -1) {
        return null;
      }

      const updated: ChatSession = {
        ...sessionsStore[index],
        title,
        updatedAt: new Date().toISOString(),
      };

      sessionsStore = [
        ...sessionsStore.slice(0, index),
        updated,
        ...sessionsStore.slice(index + 1),
      ];

      return updated;
    },

    async listMessages(sessionId: string): Promise<ChatMessage[]> {
      return messagesStore
        .filter((message) => message.sessionId === sessionId)
        .sort(sortByCreatedAtAsc);
    },

    async appendUserMessage(
      sessionId: string,
      content: string
    ): Promise<ChatMessage> {
      const sessionIndex = sessionsStore.findIndex(
        (session) => session.id === sessionId
      );
      if (sessionIndex === -1) {
        throw new Error(`Chat session not found: ${sessionId}`);
      }

      const now = new Date().toISOString();
      const message: ChatMessage = {
        id: nextMessageId(),
        sessionId,
        role: "user",
        content,
        createdAt: now,
      };

      messagesStore = [...messagesStore, message];

      const session = sessionsStore[sessionIndex];
      const updatedSession: ChatSession = {
        ...session,
        lastMessageAt: now,
        updatedAt: now,
      };

      sessionsStore = [
        ...sessionsStore.slice(0, sessionIndex),
        updatedSession,
        ...sessionsStore.slice(sessionIndex + 1),
      ];

      return message;
    },
  };
}

export async function __unsafeAddMessage(
  repo: ChatRepo,
  sessionId: string,
  role: ChatMessageRole,
  content: string
) {
  if (role !== "user") {
    throw new Error(ChatRepoErrors.INVALID_ROLE);
  }

  return repo.appendUserMessage(sessionId, content);
}
