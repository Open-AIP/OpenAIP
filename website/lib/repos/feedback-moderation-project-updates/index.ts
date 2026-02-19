export * from "./types";
export * from "./repo";
export * from "./repo.mock";

import { getFeedbackModerationProjectUpdatesRepo } from "./repo";

export const createFeedbackModerationProjectUpdatesRepo = () =>
  getFeedbackModerationProjectUpdatesRepo();
