import { NotImplementedError } from "@/lib/core/errors";
import type { ProjectsRepo } from "./repo";

export function createSupabaseProjectsRepo(): ProjectsRepo {
  throw new NotImplementedError(
    "lib/repos/projects/repo.supabase.ts not implemented (Supabase swap deferred)."
  );
}
