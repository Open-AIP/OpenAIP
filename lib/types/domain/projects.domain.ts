export type ProjectKind = "health" | "infrastructure" | "other";

export const PROJECT_STATUS_VALUES = [
  "planning",
  "ongoing",
  "completed",
  "on_hold",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number];

export type ProjectMaster = {
  projectRefCode: string;
  year: number;
  kind: ProjectKind;
  title: string;
  status: ProjectStatus;
  imageUrl?: string;
};

export type HealthProjectDetails = {
  projectRefCode: string;
  month: string;
  totalTargetParticipants: number;
  targetParticipants: string;
  implementingOffice: string;
  budgetAllocated: number;
};

export type InfrastructureProjectDetails = {
  projectRefCode: string;
  startDate: string;
  targetCompletionDate: string;
  implementingOffice: string;
  fundingSource: string;
  contractorName: string;
  contractCost: number;
};

export type ProjectUpdate = {
  id: string;
  projectRefCode: string;
  title: string;
  date: string;
  description: string;
  progressPercent?: number;
  attendanceCount?: number;
  photoUrls?: string[];
};
