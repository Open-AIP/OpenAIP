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

// [DATAFLOW] `projectService` depends on this interface; swap adapters without touching UI/pages.
// [DBV2] Backing tables are `public.projects` + (`public.health_project_details` | `public.infrastructure_project_details`).
// [SECURITY] Reads must respect AIP visibility (`can_read_aip`); writes must respect edit window (`can_edit_aip` => draft/for_revision + owner/admin).
// [SUPABASE-SWAP] Implement a Supabase adapter that maps list/get operations to `public.projects` and relies on RLS for visibility.
export interface ProjectsRepo {
  listByAip(aipId: string): Promise<UiProject[]>;
  getById(projectId: string): Promise<UiProject | null>;
  listHealth(): Promise<HealthProject[]>;
  listInfrastructure(): Promise<InfrastructureProject[]>;
  getByRefCode(projectRefCode: string): Promise<ProjectBundle | null>;
}

