import { AIP_PROJECT_ROWS_TABLE } from "@/features/aip/mock/aip-project-rows.table";
import { HEALTH_DETAILS_TABLE } from "../mock/health-details-table";
import { INFRA_DETAILS_TABLE } from "../mock/infrastructure-details-table";
import { PROJECTS_TABLE } from "../mock/projects-table";
import type {
  HealthProjectDetails,
  InfrastructureProjectDetails,
} from "../types";
import type {
  HealthProjectDetailsInput,
  InfrastructureProjectDetailsInput,
  Project,
  ProjectRepo,
} from "./ProjectRepo";

export function createMockProjectRepo(): ProjectRepo {
  return {
    async listByAipId(aipId: string): Promise<Project[]> {
      const projectRefs = AIP_PROJECT_ROWS_TABLE.filter(
        (row) => row.aipId === aipId
      ).map((row) => row.projectRefCode);

      if (projectRefs.length === 0) {
        return [];
      }

      return PROJECTS_TABLE.filter((project) =>
        projectRefs.includes(project.projectRefCode)
      );
    },

    async getById(projectId: string): Promise<Project | null> {
      return (
        PROJECTS_TABLE.find((project) => project.projectRefCode === projectId) ??
        null
      );
    },

    async updateProject(
      projectId: string,
      patch: Partial<Project>
    ): Promise<Project | null> {
      const index = PROJECTS_TABLE.findIndex(
        (project) => project.projectRefCode === projectId
      );

      if (index === -1) {
        return null;
      }

      const current = PROJECTS_TABLE[index];
      const updated: Project = {
        ...current,
        ...patch,
        projectRefCode: current.projectRefCode,
      };

      PROJECTS_TABLE[index] = updated;

      return updated;
    },

    async getHealthDetails(
      projectId: string
    ): Promise<HealthProjectDetails | null> {
      return (
        HEALTH_DETAILS_TABLE.find(
          (detail) => detail.projectRefCode === projectId
        ) ?? null
      );
    },

    async upsertHealthDetails(
      projectId: string,
      payload: HealthProjectDetailsInput
    ): Promise<HealthProjectDetails> {
      const index = HEALTH_DETAILS_TABLE.findIndex(
        (detail) => detail.projectRefCode === projectId
      );

      const updated: HealthProjectDetails = {
        projectRefCode: projectId,
        ...payload,
      };

      if (index === -1) {
        HEALTH_DETAILS_TABLE.push(updated);
        return updated;
      }

      HEALTH_DETAILS_TABLE[index] = updated;
      return updated;
    },

    async getInfrastructureDetails(
      projectId: string
    ): Promise<InfrastructureProjectDetails | null> {
      return (
        INFRA_DETAILS_TABLE.find(
          (detail) => detail.projectRefCode === projectId
        ) ?? null
      );
    },

    async upsertInfrastructureDetails(
      projectId: string,
      payload: InfrastructureProjectDetailsInput
    ): Promise<InfrastructureProjectDetails> {
      const index = INFRA_DETAILS_TABLE.findIndex(
        (detail) => detail.projectRefCode === projectId
      );

      const updated: InfrastructureProjectDetails = {
        projectRefCode: projectId,
        ...payload,
      };

      if (index === -1) {
        INFRA_DETAILS_TABLE.push(updated);
        return updated;
      }

      INFRA_DETAILS_TABLE[index] = updated;
      return updated;
    },
  };
}
