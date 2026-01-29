import type { ProjectMaster } from "./project-types";
import type { HealthProjectDetails } from "./health-types";
import type { InfrastructureProjectDetails } from "./infrastructure-types";
import type { ProjectUpdate } from "./update-types";

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
export type ProjectBundle =
  | HealthProject
  | InfrastructureProject;
