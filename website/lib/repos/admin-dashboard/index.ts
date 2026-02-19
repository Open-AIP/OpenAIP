export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import { getAdminDashboardRepo } from "./repo";

export const createAdminDashboardRepo = () => getAdminDashboardRepo();
