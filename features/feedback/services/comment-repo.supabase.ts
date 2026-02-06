import type {
  CommentRepo,
  GetThreadParams,
  ListMessagesParams,
  ListThreadsForInboxParams,
  AddReplyParams,
  ResolveThreadParams,
} from "./comment-repo";
import type { CommentMessage, CommentThread } from "../types";

// [SUPABASE-SWAP] Future Supabase adapter for the threaded feedback UI.
// [DBV2] Canonical table is `public.feedback`:
//   - listThreadsForInbox → query thread roots (`parent_feedback_id is null`) filtered by scope/inbox rules
//   - listMessages → root + replies (`id = rootId OR parent_feedback_id = rootId`)
//   - addReply → insert reply row with `parent_feedback_id = rootId`
// [SECURITY] Public reads are published-only; writes are role/kind restricted by RLS (citizen vs official vs reviewer).
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
