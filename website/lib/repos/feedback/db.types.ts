import type { FeedbackTargetType } from "@/lib/contracts/databasev2";

export type FeedbackThreadRow = {
  id: string;
  target_type: FeedbackTargetType;
  aip_id?: string | null;
  project_id?: string | null;
  parent_feedback_id?: string | null;
  body: string;
  author_id: string;
  created_at: string;
};

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

