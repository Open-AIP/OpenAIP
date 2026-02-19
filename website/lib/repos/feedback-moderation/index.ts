export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import { getFeedbackModerationRepo } from "./repo";

export const createFeedbackModerationRepo = () => getFeedbackModerationRepo();
