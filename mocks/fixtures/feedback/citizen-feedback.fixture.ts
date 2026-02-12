import { COMMENT_THREAD_IDS } from "@/mocks/fixtures/shared/id-contract.fixture";
import type { FeedbackCategory, FeedbackUser } from "@/lib/repos/feedback/citizen";

export const CITIZEN_FEEDBACK_AUTH = false;

export const CITIZEN_FEEDBACK_USER: FeedbackUser = {
  name: "Cindie Maribel",
  barangayName: "Brgy. Mamatid",
};

export const CITIZEN_FEEDBACK_CATEGORY_BY_THREAD_ID: Record<string, FeedbackCategory> = {
  [COMMENT_THREAD_IDS.thread_001]: "Concern",
  [COMMENT_THREAD_IDS.thread_002]: "Suggestion",
  [COMMENT_THREAD_IDS.thread_003]: "Question",
  [COMMENT_THREAD_IDS.thread_004]: "Concern",
  [COMMENT_THREAD_IDS.thread_005]: "Question",
  [COMMENT_THREAD_IDS.thread_006]: "Commendation",
  [COMMENT_THREAD_IDS.thread_007]: "Question",
  [COMMENT_THREAD_IDS.thread_008]: "Suggestion",
};
