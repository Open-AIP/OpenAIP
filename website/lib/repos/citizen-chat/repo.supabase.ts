import type { Json } from "@/lib/contracts/databasev2";
import { supabaseBrowser } from "@/lib/supabase/client";
import { CitizenChatRepoErrors } from "./types";
import type { CitizenChatMessage, CitizenChatRepo, CitizenChatSession } from "./repo";

type ChatSessionRow = {
  id: string;
  user_id: string;
  title: string | null;
  context: Json;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

type ChatMessageRow = {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: Json | null;
  retrieval_meta: Json | null;
  created_at: string;
};

const MESSAGE_CONTENT_LIMIT = 12000;

function toSession(row: ChatSessionRow): CitizenChatSession {
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

function toMessage(row: ChatMessageRow): CitizenChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    citations: row.citations,
    retrievalMeta: row.retrieval_meta,
    createdAt: row.created_at,
  };
}

export function createSupabaseCitizenChatRepo(): CitizenChatRepo {
  const client = supabaseBrowser();

  return {
    async listSessions(userId: string): Promise<CitizenChatSession[]> {
      const { data, error } = await client
        .from("chat_sessions")
        .select("id,user_id,title,context,last_message_at,created_at,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return ((data ?? []) as ChatSessionRow[]).map(toSession);
    },

    async getSession(sessionId: string): Promise<CitizenChatSession | null> {
      const { data, error } = await client
        .from("chat_sessions")
        .select("id,user_id,title,context,last_message_at,created_at,updated_at")
        .eq("id", sessionId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) return null;
      return toSession(data as ChatSessionRow);
    },

    async createSession(
      userId: string,
      payload?: { title?: string; context?: Record<string, unknown> }
    ): Promise<CitizenChatSession> {
      const { data, error } = await client
        .from("chat_sessions")
        .insert({
          user_id: userId,
          title: payload?.title?.trim() || null,
          context: (payload?.context ?? {}) as Json,
        })
        .select("id,user_id,title,context,last_message_at,created_at,updated_at")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return toSession(data as ChatSessionRow);
    },

    async listMessages(sessionId: string): Promise<CitizenChatMessage[]> {
      const { data, error } = await client
        .from("chat_messages")
        .select("id,session_id,role,content,citations,retrieval_meta,created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return ((data ?? []) as ChatMessageRow[]).map(toMessage);
    },

    async appendUserMessage(sessionId: string, content: string): Promise<CitizenChatMessage> {
      const normalizedContent = content.trim();
      if (!normalizedContent.length || normalizedContent.length > MESSAGE_CONTENT_LIMIT) {
        throw new Error(CitizenChatRepoErrors.INVALID_CONTENT);
      }

      const { data, error } = await client
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          role: "user",
          content: normalizedContent,
        })
        .select("id,session_id,role,content,citations,retrieval_meta,created_at")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return toMessage(data as ChatMessageRow);
    },
  };
}
