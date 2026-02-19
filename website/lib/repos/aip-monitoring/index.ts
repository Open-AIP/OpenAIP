export * from "./repo";
export * from "./repo.mock";

import { getAipMonitoringRepo } from "./repo";

export const createAipMonitoringRepo = () => getAipMonitoringRepo();
