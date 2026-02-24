import "server-only";

import { NotImplementedError } from "@/lib/core/errors";
import type { ChatRepo } from "./repo";

// [SUPABASE-SWAP] Future Supabase adapter for `ChatRepo`.
// [DBV2] Tables:
//   - `public.chat_sessions` (owned by `user_id`)
//   - `public.chat_messages` (append-only; client inserts restricted to `role='user'`)
// [DBV2-MAPPING] `chat_sessions` columns:
//   - id,user_id,title,context,last_message_at,created_at,updated_at
// [DBV2-MAPPING] `chat_messages` columns:
//   - id,session_id,role,content,citations,retrieval_meta,created_at
// [SECURITY] RLS uses `can_access_chat_session(session_id)`; assistant/system message inserts must be server-side (service role).
export function createSupabaseChatRepo(): ChatRepo {
  throw new NotImplementedError(
    "Supabase ChatRepo not implemented yet. Expected until Supabase repo is added."
  );
}
