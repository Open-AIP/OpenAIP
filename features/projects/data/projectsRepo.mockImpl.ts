/**
 * ============================================================================
 * PROJECTS FEATURE - MOCK DATA REPOSITORY (IMPLEMENTATION)
 * ============================================================================
 *
 * DATA ISOLATION: This repository ONLY accesses Projects feature mock data.
 * - Does NOT import from AIP feature
 * - Does NOT share data with AIP feature
 * - Completely self-contained within Projects feature
 *
 * This simulates a database repository layer that joins related data tables.
 * ============================================================================
 */

import { AIP_PROJECT_ROWS_TABLE } from "@/features/aip/mock/aip-project-rows.table";
import { HEALTH_DETAILS_TABLE } from "../mock/health-details-table";
import { INFRA_DETAILS_TABLE } from "../mock/infrastructure-details-table";
import { PROJECT_UPDATES_TABLE } from "../mock/project-updates-table";
import { PROJECTS_TABLE } from "../mock/projects-table";
import type {
  HealthProject,
  InfrastructureProject,
  ProjectBundle,
} from "../types";
import type {
  HealthProjectDetailsRowDTO,
  InfrastructureProjectDetailsRowDTO,
  ProjectRowDTO,
} from "./dtos/project.dto";
import { mapProjectRowToUiModel } from "./mappers/project.mapper";
import type { ProjectsRepo } from "./types";

const MONTH_INDEX: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function toMonthDate(year: number, monthLabel: string | null): string {
  if (!monthLabel) return `${year}-01-01`;
  const index = MONTH_INDEX[monthLabel.toLowerCase()];
  if (index === undefined) return `${year}-01-01`;
  const date = new Date(Date.UTC(year, index, 1));
  return date.toISOString().slice(0, 10);
}

function buildProjectRowDTO(
  projectRefCode: string,
  title: string,
  kind: "health" | "infrastructure",
  year: number,
  implementingOffice: string | null,
  total: number | null,
  startDate: string | null,
  completionDate: string | null,
  fundingSource: string | null,
  status: string,
  imageUrl?: string
): ProjectRowDTO {
  const now = new Date().toISOString();
  return {
    id: projectRefCode,
    aip_id: null,
    aip_ref_code: projectRefCode,
    program_project_description: title,
    implementing_agency: implementingOffice,
    start_date: startDate,
    completion_date: completionDate,
    expected_output: null,
    source_of_funds: fundingSource,
    personal_services: null,
    maintenance_and_other_operating_expenses: null,
    capital_outlay: null,
    total,
    climate_change_adaptation: null,
    climate_change_mitigation: null,
    climate_change_adaptation_amount: null,
    climate_change_mitigation_amount: null,
    errors: null,
    category: kind,
    sector_code: null,
    is_human_edited: null,
    created_at: now,
    updated_at: now,
    created_by: null,
    updated_by: null,
    status,
    image_url: imageUrl ?? null,
  };
}

function mapHealthDetailsDTO(
  projectRefCode: string,
  month: string,
  targetParticipants: string,
  totalTargetParticipants: number
): HealthProjectDetailsRowDTO {
  const now = new Date().toISOString();
  return {
    project_id: projectRefCode,
    program_name: month,
    description: null,
    target_participants: targetParticipants,
    total_target_participants: totalTargetParticipants,
    created_at: now,
    updated_at: now,
    created_by: null,
    updated_by: null,
  };
}

function mapInfraDetailsDTO(
  projectRefCode: string,
  projectName: string,
  contractorName: string,
  contractCost: number,
  startDate: string,
  targetCompletionDate: string
): InfrastructureProjectDetailsRowDTO {
  const now = new Date().toISOString();
  return {
    project_id: projectRefCode,
    project_name: projectName,
    contractor_name: contractorName,
    contract_cost: contractCost,
    start_date: startDate,
    target_completion_date: targetCompletionDate,
    created_at: now,
    updated_at: now,
    created_by: null,
    updated_by: null,
  };
}

function attachUpdates<T extends HealthProject | InfrastructureProject>(
  project: T
): T {
  const updates = PROJECT_UPDATES_TABLE.filter(
    (u) => u.projectRefCode === project.id
  );
  return { ...project, updates };
}

export function createMockProjectsRepoImpl(): ProjectsRepo {
  return {
    async listByAip(aipId: string): Promise<(HealthProject | InfrastructureProject)[]> {
      const projectRefs = AIP_PROJECT_ROWS_TABLE.filter(
        (row) => row.aipId === aipId
      ).map((row) => row.projectRefCode);

      if (projectRefs.length === 0) return [];

      const projects = PROJECTS_TABLE.filter((p) =>
        projectRefs.includes(p.projectRefCode)
      );

      return projects.map((project) => {
        if (project.kind === "health") {
          const details = HEALTH_DETAILS_TABLE.find(
            (d) => d.projectRefCode === project.projectRefCode
          );
          if (!details) {
            throw new Error(`Health details not found for ${project.projectRefCode}`);
          }
          const projectRow = buildProjectRowDTO(
            project.projectRefCode,
            project.title,
            "health",
            project.year,
            details.implementingOffice,
            details.budgetAllocated,
            toMonthDate(project.year, details.month),
            null,
            null,
            project.status,
            project.imageUrl
          );
          const healthDetails = mapHealthDetailsDTO(
            project.projectRefCode,
            details.month,
            details.targetParticipants,
            details.totalTargetParticipants
          );
          const mapped = mapProjectRowToUiModel(projectRow, healthDetails, null);
          return attachUpdates(mapped as HealthProject);
        }

        const details = INFRA_DETAILS_TABLE.find(
          (d) => d.projectRefCode === project.projectRefCode
        );
        if (!details) {
          throw new Error(
            `Infrastructure details not found for ${project.projectRefCode}`
          );
        }
        const projectRow = buildProjectRowDTO(
          project.projectRefCode,
          project.title,
          "infrastructure",
          project.year,
          details.implementingOffice,
          details.contractCost,
          details.startDate,
          details.targetCompletionDate,
          details.fundingSource,
          project.status,
          project.imageUrl
        );
        const infraDetails = mapInfraDetailsDTO(
          project.projectRefCode,
          project.title,
          details.contractorName,
          details.contractCost,
          details.startDate,
          details.targetCompletionDate
        );
        const mapped = mapProjectRowToUiModel(projectRow, null, infraDetails);
        return attachUpdates(mapped as InfrastructureProject);
      });
    },

    async getById(projectId: string): Promise<ProjectBundle | null> {
      const project = PROJECTS_TABLE.find(
        (p) => p.projectRefCode === projectId
      );
      if (!project) return null;

      if (project.kind === "health") {
        const details = HEALTH_DETAILS_TABLE.find(
          (d) => d.projectRefCode === project.projectRefCode
        );
        if (!details) {
          throw new Error(`Health details not found for ${project.projectRefCode}`);
        }
        const projectRow = buildProjectRowDTO(
          project.projectRefCode,
          project.title,
          "health",
          project.year,
          details.implementingOffice,
          details.budgetAllocated,
          toMonthDate(project.year, details.month),
          null,
          null,
          project.status,
          project.imageUrl
        );
        const healthDetails = mapHealthDetailsDTO(
          project.projectRefCode,
          details.month,
          details.targetParticipants,
          details.totalTargetParticipants
        );
        const mapped = mapProjectRowToUiModel(projectRow, healthDetails, null);
        return attachUpdates(mapped as HealthProject);
      }

      const details = INFRA_DETAILS_TABLE.find(
        (d) => d.projectRefCode === project.projectRefCode
      );
      if (!details) {
        throw new Error(
          `Infrastructure details not found for ${project.projectRefCode}`
        );
      }
      const projectRow = buildProjectRowDTO(
        project.projectRefCode,
        project.title,
        "infrastructure",
        project.year,
        details.implementingOffice,
        details.contractCost,
        details.startDate,
        details.targetCompletionDate,
        details.fundingSource,
        project.status,
        project.imageUrl
      );
      const infraDetails = mapInfraDetailsDTO(
        project.projectRefCode,
        project.title,
        details.contractorName,
        details.contractCost,
        details.startDate,
        details.targetCompletionDate
      );
      const mapped = mapProjectRowToUiModel(projectRow, null, infraDetails);
      return attachUpdates(mapped as InfrastructureProject);
    },

    async listHealth(): Promise<HealthProject[]> {
      const healthMasters = PROJECTS_TABLE.filter((p) => p.kind === "health");

      return healthMasters.map((master) => {
        const details = HEALTH_DETAILS_TABLE.find(
          (d) => d.projectRefCode === master.projectRefCode
        );
        if (!details) {
          throw new Error(`Health details not found for ${master.projectRefCode}`);
        }

        const projectRow = buildProjectRowDTO(
          master.projectRefCode,
          master.title,
          "health",
          master.year,
          details.implementingOffice,
          details.budgetAllocated,
          toMonthDate(master.year, details.month),
          null,
          null,
          master.status,
          master.imageUrl
        );
        const healthDetails = mapHealthDetailsDTO(
          master.projectRefCode,
          details.month,
          details.targetParticipants,
          details.totalTargetParticipants
        );
        const mapped = mapProjectRowToUiModel(projectRow, healthDetails, null);
        return attachUpdates(mapped as HealthProject);
      });
    },

    async listInfrastructure(): Promise<InfrastructureProject[]> {
      const infraMasters = PROJECTS_TABLE.filter((p) => p.kind === "infrastructure");

      return infraMasters.map((master) => {
        const details = INFRA_DETAILS_TABLE.find(
          (d) => d.projectRefCode === master.projectRefCode
        );
        if (!details) {
          throw new Error(
            `Infrastructure details not found for ${master.projectRefCode}`
          );
        }

        const projectRow = buildProjectRowDTO(
          master.projectRefCode,
          master.title,
          "infrastructure",
          master.year,
          details.implementingOffice,
          details.contractCost,
          details.startDate,
          details.targetCompletionDate,
          details.fundingSource,
          master.status,
          master.imageUrl
        );
        const infraDetails = mapInfraDetailsDTO(
          master.projectRefCode,
          master.title,
          details.contractorName,
          details.contractCost,
          details.startDate,
          details.targetCompletionDate
        );
        const mapped = mapProjectRowToUiModel(projectRow, null, infraDetails);
        return attachUpdates(mapped as InfrastructureProject);
      });
    },

    async getByRefCode(projectRefCode: string): Promise<ProjectBundle | null> {
      return this.getById(projectRefCode);
    },
  };
}
