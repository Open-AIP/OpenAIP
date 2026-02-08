import { getAppEnv } from "@/shared/config/appEnv";
import { NotImplementedError } from "@/shared/errors/notImplemented";
import type {
  CommentRepo,
  CommentTargetLookup,
  FeedbackRepo,
  FeedbackThreadsRepo,
} from "./repo";
import { feedbackDebugLog } from "./debug";
import {
  createMockCommentRepo,
  createMockCommentTargetLookup,
  createMockFeedbackRepo,
  createMockFeedbackThreadsRepo,
} from "./repo.mock";
import {
  createSupabaseCommentRepo,
  createSupabaseFeedbackRepo,
  createSupabaseFeedbackThreadsRepo,
} from "./repo.supabase";

export function getCommentRepo(): CommentRepo {
  const env = getAppEnv();
  feedbackDebugLog("threaded.repoSelector", { env });
  return env === "dev" ? createMockCommentRepo() : createSupabaseCommentRepo();
}

/**
 * Central selector: decide which lookup to use.
 * - dev => mock
 * - staging/prod => throw until Supabase lookup exists
 */
export function getCommentTargetLookup(): CommentTargetLookup {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockCommentTargetLookup();
  }

  throw new NotImplementedError(
    `CommentTargetLookup not implemented for env="${env}". Expected until Supabase lookup is added.`
  );
}

export function getFeedbackRepo(): FeedbackRepo {
  const env = getAppEnv();
  return env === "dev" ? createMockFeedbackRepo() : createSupabaseFeedbackRepo();
}

export function getFeedbackThreadsRepo(): FeedbackThreadsRepo {
  const env = getAppEnv();
  return env === "dev"
    ? createMockFeedbackThreadsRepo()
    : createSupabaseFeedbackThreadsRepo();
}
