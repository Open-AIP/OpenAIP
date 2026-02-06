import type { FeedbackRow, FeedbackTargetType } from "./feedback.types";

export type FeedbackTarget = {
  target_type: FeedbackTargetType;
  aip_id?: string | null;
  project_id?: string | null;
};

export type CreateRootInput = {
  target: FeedbackTarget;
  body: string;
  authorId: string;
};

export type CreateReplyInput = {
  parentId: string;
  body: string;
  authorId: string;
  target?: FeedbackTarget;
};

// [DATAFLOW] Threaded repository interface that mirrors DBV2 `public.feedback` rows (root + replies).
// [DBV2] Root rows have `parent_feedback_id = null`; replies reference the root id and must match target columns (enforced by trigger).
// [SUPABASE-SWAP] Implement via `public.feedback` with ordering by `created_at`; rely on RLS for published-only public reads and role gates.
export interface FeedbackThreadsRepo {
  listThreadRootsByTarget(target: FeedbackTarget): Promise<FeedbackRow[]>;
  listThreadMessages(rootId: string): Promise<FeedbackRow[]>;
  createRoot(input: CreateRootInput): Promise<FeedbackRow>;
  createReply(input: CreateReplyInput): Promise<FeedbackRow>;
}
