import type { CommentMessage, CommentThread } from "../types";
import { createMockCommentRepo } from "./comment-repo.mock";
import { createSupabaseCommentRepo } from "./comment-repo.supabase";

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
  const runtimeEnv =
    process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? "development";
  const useSupabase = runtimeEnv === "staging" || runtimeEnv === "production";

  return useSupabase ? createSupabaseCommentRepo() : createMockCommentRepo();
}
