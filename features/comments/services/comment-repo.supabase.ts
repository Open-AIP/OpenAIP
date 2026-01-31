import type {
  CommentRepo,
  GetThreadParams,
  ListMessagesParams,
  ListThreadsForInboxParams,
  AddReplyParams,
  ResolveThreadParams,
} from "./comment-repo";
import type { CommentMessage, CommentThread } from "../types";

export function createSupabaseCommentRepo(): CommentRepo {
  return {
    async listThreadsForInbox(
      _params: ListThreadsForInboxParams
    ): Promise<CommentThread[]> {
      throw new Error("Supabase comment repo not implemented yet.");
    },

    async getThread(_params: GetThreadParams): Promise<CommentThread | null> {
      throw new Error("Supabase comment repo not implemented yet.");
    },

    async listMessages(_params: ListMessagesParams): Promise<CommentMessage[]> {
      throw new Error("Supabase comment repo not implemented yet.");
    },

    async addReply(_params: AddReplyParams): Promise<CommentMessage> {
      throw new Error("Supabase comment repo not implemented yet.");
    },

    async resolveThread(_params: ResolveThreadParams): Promise<void> {
      throw new Error("Supabase comment repo not implemented yet.");
    },
  };
}
