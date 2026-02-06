import type { ProjectStatus } from "@/features/projects/types";

export type { ProjectStatus } from "@/features/projects/types";

export type HealthProjectUpdate = {
  id: string;
  title: string;
  date: string; // e.g. "January 20, 2026"
  description: string;
  attendanceCount: number;
  progressPercent: number; // 0..100
  photoUrls?: string[]; // optional thumbnails
};

export type HealthProject = {
  id: string;
  year: number;
  month: string;

  title: string;
  description: string;

  status: ProjectStatus;

  targetParticipants: string;
  totalTargetParticipants: number;

  budgetAllocated: number;
  implementingOffice: string;

  imageUrl?: string;
  updates?: HealthProjectUpdate[];
};

export type InfrastructureProjectUpdate = {
  id: string;
  title: string;
  date: string; // e.g. "January 20, 2026"
  description: string;
  progressPercent: number; // 0..100
  photoUrls?: string[];
};

export type InfrastructureProject = {
  id: string;
  year: number;

  title: string;
  description: string;
  status: ProjectStatus;

  startDate: string;
  targetCompletionDate: string;

  implementingOffice: string;
  contractorName: string;
  contractCost: number;
  fundingSource: string;

  imageUrl?: string;

  updates?: InfrastructureProjectUpdate[];};
