import "server-only";

import { selectRepo } from "@/lib/repos/_shared/selector";
import type { AccountsRepo } from "./repo";
import { createMockAccountsRepoImpl } from "./repo.mock";
import { createSupabaseAccountsRepo } from "./repo.supabase";

export function getAccountsRepo(): AccountsRepo {
  return selectRepo({
    label: "AccountsRepo",
    mock: () => createMockAccountsRepoImpl(),
    supabase: () => createSupabaseAccountsRepo(),
  });
}

