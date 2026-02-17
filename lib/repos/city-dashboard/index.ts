export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import { getCityDashboardRepo } from "./repo";

export const createCityDashboardRepo = () => getCityDashboardRepo();
