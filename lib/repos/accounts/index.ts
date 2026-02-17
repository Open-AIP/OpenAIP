export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import { getAccountsRepo } from "./repo";

export const createAccountsRepo = () => getAccountsRepo();
