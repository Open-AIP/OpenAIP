import "server-only";

import { NotImplementedError } from "@/lib/core/errors";
import type { AccountsRepo } from "./repo";

// [SUPABASE-SWAP] Future Supabase adapter for `AccountsRepo`.
// [DBV2] Tables:
// - `public.profiles` (id, role, full_name, email, barangay_id/city_id/municipality_id, is_active, timestamps)
export function createSupabaseAccountsRepo(): AccountsRepo {
  throw new NotImplementedError(
    "Supabase AccountsRepo not implemented yet. Expected until Supabase repo is added."
  );
}

