export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import { getAipProjectRepo, getAipRepo } from "./repo";
import type { CreateMockAipRepoOptions, LguScope } from "./repo";

export const createAipRepo = (options: CreateMockAipRepoOptions = {}) => getAipRepo(options);
export const createAipProjectRepo = (scope?: LguScope) => getAipProjectRepo(scope);
