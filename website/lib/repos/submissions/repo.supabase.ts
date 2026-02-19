import "server-only";

import { NotImplementedError } from "@/lib/core/errors";
import type { AipSubmissionsReviewRepo } from "./repo";

// [SUPABASE-SWAP] Future Supabase adapter for `AipSubmissionsReviewRepo`.
// [DBV2] Method -> table mapping:
//   - listSubmissionsForCity -> `public.aips` (status <> 'draft', barangay scope within city jurisdiction) + latest `public.aip_reviews`
//   - startReviewIfNeeded -> update `public.aips.status` to `under_review`
//   - requestRevision/publishAip -> insert `public.aip_reviews` + update `public.aips.status` (`for_revision` / `published`)
// [SECURITY] RLS enforces jurisdiction + non-draft reviewer gates (`aips_update_policy`, `aip_reviews_insert_policy`).
export function createSupabaseAipSubmissionsReviewRepo(): AipSubmissionsReviewRepo {
  throw new NotImplementedError(
    "Supabase AipSubmissionsReviewRepo not implemented yet. Expected until Supabase repo is added."
  );
}
