import "server-only";

import { NotImplementedError } from "@/lib/core/errors";
import type { ChatRepo } from "./repo";

// [SUPABASE-SWAP] Future Supabase adapter for `ChatRepo`.
// [DBV2] Tables:
//   - `public.chat_sessions` (owned by `user_id`)
//   - `public.chat_messages` (append-only; client inserts restricted to `role='user'`)
// [SECURITY] RLS uses `can_access_chat_session(session_id)`; assistant/system message inserts must be server-side (service role).
export function createSupabaseChatRepo(): ChatRepo {
  throw new NotImplementedError(
    "Supabase ChatRepo not implemented yet. Expected until Supabase repo is added."
  );
}
