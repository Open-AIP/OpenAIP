import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockAccountsRepoImpl } from "./repo.mock";

export type {
  AccountListInput,
  AccountListResult,
  AccountRecord,
  AccountRole,
  AccountStatus,
  AccountTab,
  AccountScopeType,
  CreateOfficialAccountInput,
  LguScopeType,
  LguOption,
  OfficialRole,
  UpdateAccountInput,
} from "./types";

import type {
  AccountListInput,
  AccountListResult,
  AccountRecord,
  AccountStatus,
  CreateOfficialAccountInput,
  UpdateAccountInput,
} from "./types";

export interface AccountsRepo {
  list(input: AccountListInput): Promise<AccountListResult>;
  createOfficial(input: CreateOfficialAccountInput): Promise<AccountRecord>;
  updateAccount(id: string, patch: UpdateAccountInput): Promise<AccountRecord>;
  setStatus(id: string, status: AccountStatus): Promise<AccountRecord>;
  deleteAccount(id: string): Promise<void>;
  resetPassword(id: string): Promise<void>;
  resendInvite(id: string): Promise<void>;
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
