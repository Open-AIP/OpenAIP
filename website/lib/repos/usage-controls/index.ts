export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import { getUsageControlsRepo } from "./repo";

export const createUsageControlsRepo = () => getUsageControlsRepo();
