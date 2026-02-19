import type { ChatMessageRole } from "../enums";
import type { ISODateTime, Json, UUID } from "../primitives";

export type ChatSessionRow = {
  id: UUID;

  /** owner: profiles.id */
  user_id: UUID;

  /** optional */
  title: string | null;

  /** jsonb */
  context: Json;

  last_message_at: ISODateTime | null;

  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type ChatMessageRow = {
  id: UUID;

  session_id: UUID;

  /** constrained in DB: ('user','assistant','system') */
  role: ChatMessageRole;

  content: string;

  citations: Json | null;
  retrieval_meta: Json | null;

  created_at: ISODateTime;
};
