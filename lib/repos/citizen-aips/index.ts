export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import { getCitizenAipRepo } from "./repo";

export const createCitizenAipRepo = () => getCitizenAipRepo();
