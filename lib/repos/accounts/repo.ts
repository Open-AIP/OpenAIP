import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockAccountsRepoImpl } from "./repo.mock";

export type {
  AccountRecord,
  AccountRole,
  AccountStatus,
  AccountTab,
  SetStatusMeta,
} from "./types";

import type {
  AccountRecord,
  AccountStatus,
  AccountTab,
  SetStatusMeta,
} from "./types";

export interface AccountsRepo {
  list(tab: AccountTab): Promise<AccountRecord[]>;
  setStatus(
    id: string,
    status: AccountStatus,
    meta?: SetStatusMeta
  ): Promise<AccountRecord>;
  resetPassword(id: string): Promise<void>;
  forceLogout(id: string): Promise<void>;
}

export function getAccountsRepo(): AccountsRepo {
  return selectRepo({
    label: "AccountsRepo",
    mock: () => createMockAccountsRepoImpl(),
    supabase: () => {
      throw new NotImplementedError(
        "AccountsRepo is server-only outside mock mode. Import from `@/lib/repos/accounts/repo.server`."
      );
    },
  });
}
