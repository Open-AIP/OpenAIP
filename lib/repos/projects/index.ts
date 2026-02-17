export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import { getProjectsRepo } from "./repo";

export const createProjectsRepo = () => getProjectsRepo();
