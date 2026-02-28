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

async function getServerClient() {
  return supabaseServer();
}

export function createSupabaseCommentRepo(): CommentRepo {
  return createCommentRepoFromClient(getServerClient);
}

export function createSupabaseCommentTargetLookup(): CommentTargetLookup {
  return createCommentTargetLookupFromClient(getServerClient);
}

export function createSupabaseFeedbackRepo(): FeedbackRepo {
  return createFeedbackRepoFromClient(getServerClient);
}

export function createSupabaseFeedbackThreadsRepo(): FeedbackThreadsRepo {
  return createFeedbackThreadsRepoFromClient(getServerClient);
}

