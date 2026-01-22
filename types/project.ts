export type ProjectStatus = "Ongoing" | "Planning" | "Completed" | "On Hold";

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

export type InfrastructureProject = {
  id: string;
  year: number;
  startDate: string;
  targetCompletionDate: string;
  title: string;
  description: string;
  implementingOffice: string;
  fundingSource: string;
  contractorName: string;
  contractCost: number;
  status: ProjectStatus;
  imageUrl?: string;
};
