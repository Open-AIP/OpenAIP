import type { ChatMessageRole } from "../enums";
import type { ISODateTime, Json, UUID } from "../primitives";

export type ChatMessageRow = {
  id: UUID;
  session_id: UUID;
  role: ChatMessageRole;
  content: string;
  citations: Json | null;
  retrieval_meta: Json | null;
  created_at: ISODateTime;
};

