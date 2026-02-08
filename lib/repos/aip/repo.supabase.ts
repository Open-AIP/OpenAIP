import { NotImplementedError } from "@/shared/errors/notImplemented";
import type { AipProjectRepo, AipRepo } from "./repo";

export function createSupabaseAipRepo(): AipRepo {
  throw new NotImplementedError(
    "lib/repos/aip/repo.supabase.ts not implemented (Supabase swap deferred)."
  );
}

export function createSupabaseAipProjectRepo(): AipProjectRepo {
  throw new NotImplementedError(
    "lib/repos/aip/repo.supabase.ts not implemented (Supabase swap deferred)."
  );
}

