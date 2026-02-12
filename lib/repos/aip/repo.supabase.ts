import "server-only";

import { NotImplementedError } from "@/lib/core/errors";
import type { AipProjectRepo, AipRepo } from "./repo";

// [SUPABASE-SWAP] Future Supabase adapters for AIP list/detail and AIP rows.
// [DBV2] Tables (canonical):
// - `public.aips` (id, scope ids, status, title/description/year/budget metadata, timestamps)
// - `public.projects` (rows under an AIP via `aip_id`)
// - `public.health_project_details` / `public.infrastructure_project_details` (optional joins for UI)
// [SECURITY] Reads/writes must rely on RLS helpers like `public.can_read_aip(aip_id)` and reviewer policies.
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
