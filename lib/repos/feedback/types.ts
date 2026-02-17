import type { Comment } from "@/lib/types/domain/feedback.domain";

export type {
  CommentAuthorRole,
  CommentMessage,
  ProjectCommentTarget,
  AipCommentTarget,
  AipItemCommentTarget,
  CommentTarget,
  CommentThreadStatus,
  CommentThreadPreview,
  CommentThread,
  CommentSidebarItem,
  CommentResponse,
  Comment,
  CommentProjectOption,
  CommentsFilterOptions,
} from "@/lib/types/domain/feedback.domain";

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

