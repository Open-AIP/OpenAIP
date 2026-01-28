export type ProjectKind = "health" | "infrastructure";
export type ProjectStatus = "planning" | "ongoing" | "completed" | "on_hold";

export type ProjectMaster = {
  projectRefCode: string; // ✅ single join key
  year: number;
  kind: ProjectKind;

  title: string;
  status: ProjectStatus;
  imageUrl?: string;
};
