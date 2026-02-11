import { NotImplementedError } from "@/lib/core/errors";
import type { AuditRepo } from "./repo";

export function createSupabaseAuditRepo(): AuditRepo {
  throw new NotImplementedError(
    "AuditRepo.supabase not implemented. This feature is currently DISPLAY ONLY."
  );
}
