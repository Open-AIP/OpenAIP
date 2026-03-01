import "server-only";

import { supabaseServer } from "@/lib/supabase/server";
import type {
  CommentRepo,
  CommentTargetLookup,
  FeedbackRepo,
  FeedbackThreadsRepo,
} from "./repo";
import {
  createCommentRepoFromClient,
  createCommentTargetLookupFromClient,
  createFeedbackRepoFromClient,
  createFeedbackThreadsRepoFromClient,
} from "./repo.supabase.base";

type FeedbackClientFactory = Parameters<typeof createCommentRepoFromClient>[0];

async function getServerClient() {
  return supabaseServer();
}

export function createSupabaseCommentRepo(): CommentRepo {
  return createCommentRepoFromClient(getServerClient as unknown as FeedbackClientFactory);
}

export function createSupabaseCommentTargetLookup(): CommentTargetLookup {
  return createCommentTargetLookupFromClient(getServerClient as unknown as FeedbackClientFactory);
}

export function createSupabaseFeedbackRepo(): FeedbackRepo {
  return createFeedbackRepoFromClient(getServerClient as unknown as FeedbackClientFactory);
}

export function createSupabaseFeedbackThreadsRepo(): FeedbackThreadsRepo {
  return createFeedbackThreadsRepoFromClient(getServerClient as unknown as FeedbackClientFactory);
}

