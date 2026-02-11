import "server-only";

import { NotImplementedError } from "@/lib/core/errors";
import type { AipProjectRepo, AipRepo } from "./repo";

export function createSupabaseAipRepo(): AipRepo {
  throw new NotImplementedError(
    "AipRepo.supabase not implemented (Supabase swap deferred)."
  );
}

export function createSupabaseAipProjectRepo(): AipProjectRepo {
  throw new NotImplementedError(
    "AipProjectRepo.supabase not implemented (Supabase swap deferred)."
  );
}
