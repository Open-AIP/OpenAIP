import type { CommentTarget } from "./comment-target";

export type CommentThreadStatus = "no_response" | "responded";

export type CommentThreadPreview = {
  text: string;
  updatedAt: string;
  status: CommentThreadStatus;
  authorName?: string;
  authorScopeLabel?: string | null;
};

export type CommentThread = {
  id: string;
  createdAt: string;
  createdByUserId: string;
  target: CommentTarget;
  preview: CommentThreadPreview;
};
