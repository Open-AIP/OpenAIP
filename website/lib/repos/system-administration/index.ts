export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import { getSystemAdministrationRepo } from "./repo";

export const createSystemAdministrationRepo = () => getSystemAdministrationRepo();
