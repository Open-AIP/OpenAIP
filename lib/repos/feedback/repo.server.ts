import "server-only";

import { selectRepo } from "@/lib/repos/_shared/selector";
import { NotImplementedError } from "@/lib/core/errors";
import type { CommentRepo, CommentTargetLookup, FeedbackRepo, FeedbackThreadsRepo } from "./repo";
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
  return selectRepo({
    label: "CommentRepo",
    mock: () => createMockCommentRepo(),
    supabase: () => createSupabaseCommentRepo(),
  });
}

export function getCommentTargetLookup(): CommentTargetLookup {
  return selectRepo({
    label: "CommentTargetLookup",
    mock: () => createMockCommentTargetLookup(),
    supabase: () => {
      throw new NotImplementedError("CommentTargetLookup.supabase not implemented yet.");
    },
  });
}

export function getFeedbackRepo(): FeedbackRepo {
  return selectRepo({
    label: "FeedbackRepo",
    mock: () => createMockFeedbackRepo(),
    supabase: () => createSupabaseFeedbackRepo(),
  });
}

export function getFeedbackThreadsRepo(): FeedbackThreadsRepo {
  return selectRepo({
    label: "FeedbackThreadsRepo",
    mock: () => createMockFeedbackThreadsRepo(),
    supabase: () => createSupabaseFeedbackThreadsRepo(),
  });
}

