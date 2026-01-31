export type CommentStatus = "no_response" | "responded";

export type CommentCardModel = {
  commenterName: string;
  barangayName?: string | null;
  createdAt: string | Date;
  projectLabel: string;
  comment: string;
  status: CommentStatus;
  response?: {
    responderName: string;
    responderRoleLabel?: string | null;
    message: string;
    createdAt: string | Date;
  } | null;
};

export type CommentCardProps = CommentCardModel & {
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  showActions?: boolean;
};

export * from "./comments";
export * from "./comment-target";
export * from "./comment-thread";
export * from "./comment-message";
export * from "./comment-sidebar-item";
