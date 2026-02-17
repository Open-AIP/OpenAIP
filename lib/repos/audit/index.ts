export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import { getAuditRepo } from "./repo";

export const createAuditRepo = () => getAuditRepo();
