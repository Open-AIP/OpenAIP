import type { ChatMessage, ChatSession } from "../../types";
import { ChatRepoErrors } from "../ChatRepo";
import type { ChatRepo } from "../ChatRepo";

type Store = {
  sessionsById: Map<string, ChatSession>;
  messagesBySessionId: Map<string, ChatMessage[]>;
  sessionSequence: number;
  messageSequence: number;
};

function createStore(): Store {
  return {
    sessionsById: new Map<string, ChatSession>(),
    messagesBySessionId: new Map<string, ChatMessage[]>(),
    sessionSequence: 1,
    messageSequence: 1,
  };
}

function nextSessionId(store: Store) {
  const id = `chat_${String(store.sessionSequence).padStart(3, "0")}`;
  store.sessionSequence += 1;
  return id;
}

function nextMessageId(store: Store) {
  const id = `cmsg_${String(store.messageSequence).padStart(4, "0")}`;
  store.messageSequence += 1;
  return id;
}

export function createMockChatRepo(): ChatRepo {
  const store = createStore();

  return {
    async listSessions(userId: string): Promise<ChatSession[]> {
      return Array.from(store.sessionsById.values())
        .filter((session) => session.userId === userId)
        .sort((a, b) => {
          const aTime = a.lastMessageAt ?? a.createdAt;
          const bTime = b.lastMessageAt ?? b.createdAt;
          const diff = new Date(bTime).getTime() - new Date(aTime).getTime();
          if (diff !== 0) return diff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    },

    async createSession(
      userId: string,
      title?: string | null,
      context?: Record<string, any>
    ): Promise<ChatSession> {
      const now = new Date().toISOString();
      const session: ChatSession = {
        id: nextSessionId(store),
        userId,
        title: title ?? null,
        context: context ?? {},
        lastMessageAt: null,
        createdAt: now,
        updatedAt: now,
      };

      store.sessionsById.set(session.id, session);
      store.messagesBySessionId.set(session.id, []);
      return session;
    },

    async listMessages(sessionId: string): Promise<ChatMessage[]> {
      const messages = store.messagesBySessionId.get(sessionId);
      if (!messages) {
        throw new Error(ChatRepoErrors.NOT_FOUND);
      }
      return [...messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    },

    async addUserMessage(sessionId: string, content: string): Promise<ChatMessage> {
      const trimmed = content.trim();
      if (!trimmed) {
        throw new Error(ChatRepoErrors.INVALID_CONTENT);
      }

      const session = store.sessionsById.get(sessionId);
      if (!session) {
        throw new Error(ChatRepoErrors.NOT_FOUND);
      }

      const now = new Date().toISOString();
      const message: ChatMessage = {
        id: nextMessageId(store),
        sessionId,
        role: "user",
        content: trimmed,
        createdAt: now,
      };

      const list = store.messagesBySessionId.get(sessionId) ?? [];
      store.messagesBySessionId.set(sessionId, [...list, message]);

      store.sessionsById.set(sessionId, {
        ...session,
        lastMessageAt: now,
        updatedAt: now,
      });

      return message;
    },
  };
}

export async function __unsafeAddMessage(
  repo: ChatRepo,
  sessionId: string,
  role: "user" | "assistant" | "system",
  content: string
) {
  if (role !== "user") {
    throw new Error(ChatRepoErrors.INVALID_ROLE);
  }
  return repo.addUserMessage(sessionId, content);
}
