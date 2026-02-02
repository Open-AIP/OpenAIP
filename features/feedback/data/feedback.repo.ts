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

export interface FeedbackRepo {
  listThreadRootsByTarget(target: FeedbackTarget): Promise<FeedbackRow[]>;
  listThreadMessages(rootId: string): Promise<FeedbackRow[]>;
  createRoot(input: CreateRootInput): Promise<FeedbackRow>;
  createReply(input: CreateReplyInput): Promise<FeedbackRow>;
}
