import { getAppEnv } from "@/lib/config/appEnv";
import { NotImplementedError } from "@/lib/core/errors";
import type { AccountsRepo } from "./repo";
import { createMockAccountsRepoImpl } from "./repo.mock";

export function getAccountsRepo(): AccountsRepo {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockAccountsRepoImpl();
  }

  throw new NotImplementedError(
    `AccountsRepo not implemented for env="${env}". Expected until Supabase repo is added.`
  );
}
