export type ProjectKind = "health" | "infrastructure";

export const PROJECT_STATUS_VALUES = [
  "planning",
  "ongoing",
  "completed",
  "on_hold",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number];

export type ProjectMaster = {
  projectRefCode: string; // ✅ single join key
  year: number;
  kind: ProjectKind;

  title: string;
  status: ProjectStatus;
  imageUrl?: string;
};
