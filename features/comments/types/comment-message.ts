export type CommentAuthorRole =
  | "citizen"
  | "barangay_official"
  | "city_official"
  | "admin";

export type CommentMessage = {
  id: string;
  threadId: string;
  authorRole: CommentAuthorRole;
  authorId: string;
  text: string;
  createdAt: string;
};
