import type {
  CommentRepo,
  CommentTargetLookup,
  FeedbackRepo,
  FeedbackThreadsRepo,
} from "./repo";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  createCommentRepoFromClient,
  createCommentTargetLookupFromClient,
  createFeedbackRepoFromClient,
  createFeedbackThreadsRepoFromClient,
} from "./repo.supabase.base";

type FeedbackClientFactory = Parameters<typeof createCommentRepoFromClient>[0];

async function getBrowserClient() {
  return supabaseBrowser();
}

export function createSupabaseCommentRepoClient(): CommentRepo {
  return createCommentRepoFromClient(getBrowserClient as unknown as FeedbackClientFactory);
}

export function createSupabaseCommentTargetLookupClient(): CommentTargetLookup {
  return createCommentTargetLookupFromClient(getBrowserClient as unknown as FeedbackClientFactory);
}

export function createSupabaseFeedbackRepoClient(): FeedbackRepo {
  return createFeedbackRepoFromClient(getBrowserClient as unknown as FeedbackClientFactory);
}

export function createSupabaseFeedbackThreadsRepoClient(): FeedbackThreadsRepo {
  return createFeedbackThreadsRepoFromClient(getBrowserClient as unknown as FeedbackClientFactory);
}

