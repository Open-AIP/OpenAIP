export type FeedbackTargetType = "aip" | "project";

export type FeedbackRow = {
  id: string;
  target_type: FeedbackTargetType;
  aip_id?: string | null;
  project_id?: string | null;
  parent_feedback_id?: string | null;
  body: string;
  author_id: string;
  created_at: string;
};
