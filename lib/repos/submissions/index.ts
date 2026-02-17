export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import { getAipSubmissionsReviewRepo } from "./repo";

export const createAipSubmissionsReviewRepo = () => getAipSubmissionsReviewRepo();
