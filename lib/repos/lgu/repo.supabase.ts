import "server-only";

import { NotImplementedError } from "@/lib/core/errors";
import type { LguRepo } from "./repo";

// [SUPABASE-SWAP] Future Supabase adapter for `LguRepo`.
// [DBV2] Likely tables:
// - `public.cities`
// - `public.barangays` (and optionally regions/provinces/municipalities if you expose them)
export function createSupabaseLguRepo(): LguRepo {
  throw new NotImplementedError(
    "Supabase LguRepo not implemented yet. Expected until Supabase repo is added."
  );
}

