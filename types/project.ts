export type ProjectStatus = "Ongoing" | "Planning" | "Completed" | "On Hold";

export type HealthProject = {
  id: string;
  year: number;
  month: string; // for your month dropdown (e.g. "January")
  title: string;
  description: string;
  targetParticipants: string;
  totalTargetParticipants: number;
  budgetAllocated: number;
  implementingOffice: string;
  status: ProjectStatus;
  imageUrl?: string; // optional: "/mock/health/doctor-phone.jpg"
};

export type InfrastructureProject = {
  id: string;
  year: number;
  startDate: string; // ISO string or readable (e.g. "2026-01-10")
  targetCompletionDate: string; // ISO string or readable
  title: string;
  description: string;
  implementingOffice: string;
  fundingSource: string;
  contractorName: string;
  contractCost: number;
  status: ProjectStatus;
  imageUrl?: string; // optional: "/mock/infra/road.jpg"
};
