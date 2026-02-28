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

async function getBrowserClient() {
  return supabaseBrowser();
}

export function createSupabaseCommentRepoClient(): CommentRepo {
  return createCommentRepoFromClient(getBrowserClient);
}

export function createSupabaseCommentTargetLookupClient(): CommentTargetLookup {
  return createCommentTargetLookupFromClient(getBrowserClient);
}

export function createSupabaseFeedbackRepoClient(): FeedbackRepo {
  return createFeedbackRepoFromClient(getBrowserClient);
}

export function createSupabaseFeedbackThreadsRepoClient(): FeedbackThreadsRepo {
  return createFeedbackThreadsRepoFromClient(getBrowserClient);
}

