import "server-only";

import { NotImplementedError } from "@/lib/core/errors";
import type { ProjectsRepo } from "./repo";

// [SUPABASE-SWAP] Future Supabase adapter for `ProjectsRepo`.
// [DBV2] Tables (canonical):
// - `public.projects` (id, aip_id, aip_ref_code, program_project_description, category, totals, timestamps, etc.)
// - `public.health_project_details` (project_id, program_name, description, target_participants, total_target_participants, audit fields)
// - `public.infrastructure_project_details` (project_id, project_name, contractor_name, contract_cost, start_date, target_completion_date, audit fields)
// [SECURITY] Reads must respect `public.can_read_project(project_id)` / `public.can_read_aip(aip_id)` via RLS.
export function createSupabaseProjectsRepo(): ProjectsRepo {
  throw new NotImplementedError(
    "lib/repos/projects/repo.supabase.ts not implemented (Supabase swap deferred)."
  );
}
