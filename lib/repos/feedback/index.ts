export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import {
  getCommentRepo,
  getCommentTargetLookup,
  getFeedbackRepo,
  getFeedbackThreadsRepo,
} from "./repo";

export const createCommentRepo = () => getCommentRepo();
export const createCommentTargetLookup = () => getCommentTargetLookup();
export const createFeedbackRepo = () => getFeedbackRepo();
export const createFeedbackThreadsRepo = () => getFeedbackThreadsRepo();
