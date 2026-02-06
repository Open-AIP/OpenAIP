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
