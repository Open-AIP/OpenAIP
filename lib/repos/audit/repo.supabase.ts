import { NotImplementedError } from "@/lib/errors/notImplemented";
import type { AuditRepo } from "./repo";

export function createSupabaseAuditRepo(): AuditRepo {
  throw new NotImplementedError(
    "AuditRepo.supabase not implemented. This feature is currently DISPLAY ONLY."
  );
}
