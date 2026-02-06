import type { CommentMessage, CommentThread } from "../types";
import { createMockCommentRepo } from "./comment-repo.mock";
import { createSupabaseCommentRepo } from "./comment-repo.supabase";
import { getAppEnv } from "@/shared/config/appEnv";
import { feedbackDebugLog } from "../lib/debug";

export type ListThreadsForInboxParams = {
  lguId: string;
};

export type GetThreadParams = {
  threadId: string;
};

export type ListMessagesParams = {
  threadId: string;
};

export type AddReplyParams = {
  threadId: string;
  text: string;
};

export type ResolveThreadParams = {
  threadId: string;
};

// [DATAFLOW] UI components call this repo to list threads/messages and post replies.
// [DBV2] Canonical persistence is `public.feedback` (thread root + replies via `parent_feedback_id`), with public visibility only when parent AIP is `published`.
// [SECURITY] DBV2 restricts write kinds: citizens can write limited kinds (published-only); officials/reviewers write `kind='lgu_note'` only.
export type CommentRepo = {
  listThreadsForInbox: (
    params: ListThreadsForInboxParams
  ) => Promise<CommentThread[]>;
  getThread: (params: GetThreadParams) => Promise<CommentThread | null>;
  listMessages: (
    params: ListMessagesParams
  ) => Promise<CommentMessage[]>;
  addReply: (params: AddReplyParams) => Promise<CommentMessage>;
  resolveThread?: (params: ResolveThreadParams) => Promise<void>;
};

export function getCommentRepo(): CommentRepo {
  const env = getAppEnv();
  feedbackDebugLog("threaded.repoSelector", { env });
  return env === "dev" ? createMockCommentRepo() : createSupabaseCommentRepo();
}
