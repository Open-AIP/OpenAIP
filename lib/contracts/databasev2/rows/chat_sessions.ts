import type { ISODateTime, Json, UUID } from "../primitives";

export type ChatSessionRow = {
  id: UUID;
  user_id: UUID;
  title: string | null;
  context: Json;
  last_message_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

