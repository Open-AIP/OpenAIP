import type {
  HealthProjectDetails,
  InfrastructureProjectDetails,
  ProjectKind,
  ProjectMaster,
  ProjectStatus,
  ProjectUpdate,
} from "@/lib/types/domain/projects.domain";

export {
  PROJECT_STATUS_VALUES,
} from "@/lib/types/domain/projects.domain";

export type {
  ProjectKind,
  ProjectStatus,
  ProjectMaster,
  HealthProjectDetails,
  InfrastructureProjectDetails,
  ProjectUpdate,
} from "@/lib/types/domain/projects.domain";

export type ProjectUpdateUi = {
  id: string;
  title: string;
  date: string;
  description: string;
  progressPercent: number;
  photoUrls?: string[];
  attendanceCount?: number;
};

/**
 * UI model for health cards + health list page.
 * Note: keeps `id` because your current UI uses `project.id`.
 * We map id = projectRefCode in the repo.
 */
export type HealthProject =
  & Omit<ProjectMaster, "projectRefCode" | "kind">
  & {
    id: string; // alias of projectRefCode
    kind: "health";

    // health-specific display fields
    month: HealthProjectDetails["month"];
    description: string;
    totalTargetParticipants: HealthProjectDetails["totalTargetParticipants"];
    targetParticipants: HealthProjectDetails["targetParticipants"];
    implementingOffice: HealthProjectDetails["implementingOffice"];
    budgetAllocated: HealthProjectDetails["budgetAllocated"];

    updates: ProjectUpdate[];
  };

/**
 * UI model for infra cards + infra list page.
 * id is alias of projectRefCode.
 */
export type InfrastructureProject =
  & Omit<ProjectMaster, "projectRefCode" | "kind">
  & {
    id: string; // alias of projectRefCode
    kind: "infrastructure";

    // infra-specific display fields
    description: string;
    startDate: InfrastructureProjectDetails["startDate"];
    targetCompletionDate: InfrastructureProjectDetails["targetCompletionDate"];
    implementingOffice: InfrastructureProjectDetails["implementingOffice"];
    fundingSource: InfrastructureProjectDetails["fundingSource"];
    contractorName: InfrastructureProjectDetails["contractorName"];
    contractCost: InfrastructureProjectDetails["contractCost"];

    updates: ProjectUpdate[];
  };

/**
 * Detail bundle returned by getByRefCode().
 * Your detail views can use this OR the specific Health/Infra UI types above.
 */
export type ProjectBundle = HealthProject | InfrastructureProject;

export type OtherProject = {
  id: string;
  projectRefCode: string;
  year: number;
  kind: "other";
  title: string;
  status: ProjectStatus;
  imageUrl?: string;
  updates: ProjectUpdate[];
};

export type UiProject = HealthProject | InfrastructureProject | OtherProject;

