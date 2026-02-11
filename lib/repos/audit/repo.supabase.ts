import "server-only";

import { NotImplementedError } from "@/lib/core/errors";
import type { AuditRepo } from "./repo";

// [SUPABASE-SWAP] Future Supabase adapter for `AuditRepo`.
// [DBV2] Table:
// - `public.activity_log` (append-only; writes are server-only/service role per DBV2 policies)
// [SECURITY] Reads are RLS-gated (admin all; officials only their own by `actor_id = auth.uid()`).
export function createSupabaseAuditRepo(): AuditRepo {
  throw new NotImplementedError(
    "AuditRepo.supabase not implemented. This feature is currently DISPLAY ONLY."
  );
}
