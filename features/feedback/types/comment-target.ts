export type ProjectCommentTarget = {
  targetKind: "project";
  projectId: string;
};

export type AipItemCommentTarget = {
  targetKind: "aip_item";
  aipId: string;
  aipItemId: string;
};

export type CommentTarget = ProjectCommentTarget | AipItemCommentTarget;
