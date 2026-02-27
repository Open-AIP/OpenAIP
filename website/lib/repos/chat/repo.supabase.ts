import "server-only";

import { supabaseServer } from "@/lib/supabase/server";
import { ChatRepoErrors } from "./types";
import type { ChatCitation, ChatRetrievalMeta } from "./types";
import type { ChatMessage, ChatRepo, ChatSession } from "./repo";

type ChatSessionRow = {
  id: string;
  user_id: string;
  title: string | null;
  context: unknown;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

type ChatMessageRow = {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: unknown | null;
  retrieval_meta: unknown | null;
  created_at: string;
};

function mapSession(row: ChatSessionRow): ChatSession {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    context: row.context,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
    citations: (row.citations as ChatCitation[] | null) ?? null,
    retrievalMeta: (row.retrieval_meta as ChatRetrievalMeta | null) ?? null,
  };
}

function normalizeTitle(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 200);
}

function normalizeContent(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(ChatRepoErrors.INVALID_CONTENT);
  }
  if (normalized.length > 12000) {
    throw new Error(ChatRepoErrors.INVALID_CONTENT);
  }
  return normalized;
}

export function createSupabaseChatRepo(): ChatRepo {
  return {
    async listSessions(userId: string): Promise<ChatSession[]> {
      const client = await supabaseServer();
      const { data, error } = await client
        .from("chat_sessions")
        .select("id,user_id,title,context,last_message_at,created_at,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []).map((row) => mapSession(row as ChatSessionRow));
    },

    async getSession(sessionId: string): Promise<ChatSession | null> {
      const client = await supabaseServer();
      const { data, error } = await client
        .from("chat_sessions")
        .select("id,user_id,title,context,last_message_at,created_at,updated_at")
        .eq("id", sessionId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data ? mapSession(data as ChatSessionRow) : null;
    },

    async createSession(
      userId: string,
      payload?: { title?: string; context?: unknown }
    ): Promise<ChatSession> {
      const client = await supabaseServer();
      const { data, error } = await client
        .from("chat_sessions")
        .insert({
          user_id: userId,
          title: normalizeTitle(payload?.title),
          context: payload?.context ?? {},
        })
        .select("id,user_id,title,context,last_message_at,created_at,updated_at")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? ChatRepoErrors.NOT_FOUND);
      }

      return mapSession(data as ChatSessionRow);
    },

    async renameSession(sessionId: string, title: string): Promise<ChatSession | null> {
      const client = await supabaseServer();
      const { data, error } = await client
        .from("chat_sessions")
        .update({ title: normalizeTitle(title) })
        .eq("id", sessionId)
        .select("id,user_id,title,context,last_message_at,created_at,updated_at")
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data ? mapSession(data as ChatSessionRow) : null;
    },

    async listMessages(sessionId: string): Promise<ChatMessage[]> {
      const client = await supabaseServer();
      const { data, error } = await client
        .from("chat_messages")
        .select("id,session_id,role,content,citations,retrieval_meta,created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []).map((row) => mapMessage(row as ChatMessageRow));
    },

    async appendUserMessage(sessionId: string, content: string): Promise<ChatMessage> {
      const normalizedContent = normalizeContent(content);
      const client = await supabaseServer();

      const { data, error } = await client
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          role: "user",
          content: normalizedContent,
        })
        .select("id,session_id,role,content,citations,retrieval_meta,created_at")
        .single();

      if (error || !data) {
        if (error?.code === "PGRST116") {
          throw new Error(ChatRepoErrors.NOT_FOUND);
        }
        throw new Error(error?.message ?? ChatRepoErrors.NOT_FOUND);
      }

      return mapMessage(data as ChatMessageRow);
    },
  };
}
