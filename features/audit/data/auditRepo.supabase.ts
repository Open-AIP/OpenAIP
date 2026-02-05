import { NotImplementedError } from "@/shared/errors/notImplemented";
import type { AuditRepo } from "./AuditRepo";

export function createSupabaseAuditRepo(): AuditRepo {
  throw new NotImplementedError(
    "AuditRepo.supabase not implemented. This feature is currently DISPLAY ONLY."
  );
}

