import "server-only";

import { selectRepo } from "@/lib/repos/_shared/selector";
import type { CommentRepo, CommentTargetLookup, FeedbackRepo, FeedbackThreadsRepo } from "./repo";
import {
  createMockCommentRepo,
  createMockCommentTargetLookup,
  createMockFeedbackRepo,
  createMockFeedbackThreadsRepo,
} from "./repo.mock";
import {
  createSupabaseCommentRepo,
  createSupabaseCommentTargetLookup,
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
    supabase: () => createSupabaseCommentTargetLookup(),
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

