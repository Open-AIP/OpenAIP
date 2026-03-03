import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockCitizenChatRepo } from "./repo.mock";
import { createSupabaseCitizenChatRepo } from "./repo.supabase";
import type { Json } from "@/lib/contracts/databasev2";

export type {
  CitizenChatEvidenceItem,
  CitizenChatMessage,
  CitizenChatReplyPayload,
  CitizenChatSession,
  ChatMessageRole,
} from "./types";
export { CitizenChatRepoErrors } from "./types";

import type { CitizenChatMessage, CitizenChatSession } from "./types";

export interface CitizenChatRepo {
  listSessions(userId: string): Promise<CitizenChatSession[]>;
  getSession(sessionId: string): Promise<CitizenChatSession | null>;
  createSession(
    userId: string,
    payload?: { title?: string; context?: { [key: string]: Json } }
  ): Promise<CitizenChatSession>;
  renameSession(sessionId: string, title: string): Promise<CitizenChatSession | null>;
  deleteSession(sessionId: string): Promise<boolean>;
  listMessages(sessionId: string): Promise<CitizenChatMessage[]>;
  appendUserMessage(sessionId: string, content: string): Promise<CitizenChatMessage>;
}

export function getCitizenChatRepo(): CitizenChatRepo {
  return selectRepo({
    label: "CitizenChatRepo",
    mock: () => createMockCitizenChatRepo(),
    supabase: () => createSupabaseCitizenChatRepo(),
  });
}
