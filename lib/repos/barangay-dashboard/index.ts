export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import { getBarangayDashboardRepo } from "./repo";

export const createBarangayDashboardRepo = () => getBarangayDashboardRepo();
