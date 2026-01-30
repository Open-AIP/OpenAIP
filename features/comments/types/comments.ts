export type CommentResponse = {
  responder_name: string;
  message: string;
  created_at: string;
};

export type Comment = {
  id: string;
  year: number;
  project_id: string;
  project_title: string;
  commenter_name: string;
  commenter_scope_label: string;
  message: string;
  created_at: string;
  response_status: "no_response" | "responded";
  response?: CommentResponse | null;
};

export type CommentProjectOption = {
  project_id: string;
  project_title: string;
};

export type CommentsFilterOptions = {
  years: number[];
  projects: CommentProjectOption[];
};

export type ListCommentsParams = {
  year?: number | "all";
  projectId?: string | "all";
  status?: "all" | "no_response" | "responded";
  q?: string;
};

export type ListCommentsResult = {
  items: Comment[];
  total: number;
};

export type RespondToCommentInput = {
  commentId: string;
  responderName: string;
  message: string;
};
