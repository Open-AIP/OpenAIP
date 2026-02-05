import { NotImplementedError } from "@/shared/errors/notImplemented";
import type { SubmissionsRepo } from "./SubmissionsRepo";

export function createSupabaseSubmissionsRepo(): SubmissionsRepo {
  throw new NotImplementedError(
    "SubmissionsRepo.supabase not implemented. This feature is currently DISPLAY ONLY."
  );
}

