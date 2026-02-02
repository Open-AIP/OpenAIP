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

import { HEALTH_DETAILS_TABLE } from "../mock/health-details-table";
import { INFRA_DETAILS_TABLE } from "../mock/infrastructure-details-table";
import { PROJECT_UPDATES_TABLE } from "../mock/project-updates-table";
import { PROJECTS_TABLE } from "../mock/projects-table";
import type {
  HealthProject,
  InfrastructureProject,
  ProjectBundle,
} from "../types";
import type { ProjectsRepo } from "./types";

export function createMockProjectsRepoImpl(): ProjectsRepo {
  return {
    async listHealth(): Promise<HealthProject[]> {
      const healthMasters = PROJECTS_TABLE.filter((p) => p.kind === "health");

      return healthMasters.map((master) => {
        const details = HEALTH_DETAILS_TABLE.find(
          (d) => d.projectRefCode === master.projectRefCode
        );
        const updates = PROJECT_UPDATES_TABLE.filter(
          (u) => u.projectRefCode === master.projectRefCode
        );

        if (!details) {
          throw new Error(`Health details not found for ${master.projectRefCode}`);
        }

        return {
          id: master.projectRefCode,
          kind: "health" as const,
          year: master.year,
          title: master.title,
          status: master.status,
          imageUrl: master.imageUrl,
          month: details.month,
          totalTargetParticipants: details.totalTargetParticipants,
          targetParticipants: details.targetParticipants,
          implementingOffice: details.implementingOffice,
          budgetAllocated: details.budgetAllocated,
          updates,
        };
      });
    },

    async listInfrastructure(): Promise<InfrastructureProject[]> {
      const infraMasters = PROJECTS_TABLE.filter((p) => p.kind === "infrastructure");

      return infraMasters.map((master) => {
        const details = INFRA_DETAILS_TABLE.find(
          (d) => d.projectRefCode === master.projectRefCode
        );
        const updates = PROJECT_UPDATES_TABLE.filter(
          (u) => u.projectRefCode === master.projectRefCode
        );

        if (!details) {
          throw new Error(
            `Infrastructure details not found for ${master.projectRefCode}`
          );
        }

        return {
          id: master.projectRefCode,
          kind: "infrastructure" as const,
          year: master.year,
          title: master.title,
          status: master.status,
          imageUrl: master.imageUrl,
          startDate: details.startDate,
          targetCompletionDate: details.targetCompletionDate,
          implementingOffice: details.implementingOffice,
          fundingSource: details.fundingSource,
          contractorName: details.contractorName,
          contractCost: details.contractCost,
          updates,
        };
      });
    },

    async getByRefCode(projectRefCode: string): Promise<ProjectBundle | null> {
      const master = PROJECTS_TABLE.find((p) => p.projectRefCode === projectRefCode);

      if (!master) {
        return null;
      }

      const updates = PROJECT_UPDATES_TABLE.filter(
        (u) => u.projectRefCode === projectRefCode
      );

      if (master.kind === "health") {
        const details = HEALTH_DETAILS_TABLE.find(
          (d) => d.projectRefCode === projectRefCode
        );

        if (!details) {
          throw new Error(`Health details not found for ${projectRefCode}`);
        }

        return {
          id: master.projectRefCode,
          kind: "health" as const,
          year: master.year,
          title: master.title,
          status: master.status,
          imageUrl: master.imageUrl,
          month: details.month,
          totalTargetParticipants: details.totalTargetParticipants,
          targetParticipants: details.targetParticipants,
          implementingOffice: details.implementingOffice,
          budgetAllocated: details.budgetAllocated,
          updates,
        };
      }

      const details = INFRA_DETAILS_TABLE.find(
        (d) => d.projectRefCode === projectRefCode
      );

      if (!details) {
        throw new Error(`Infrastructure details not found for ${projectRefCode}`);
      }

      return {
        id: master.projectRefCode,
        kind: "infrastructure" as const,
        year: master.year,
        title: master.title,
        status: master.status,
        imageUrl: master.imageUrl,
        startDate: details.startDate,
        targetCompletionDate: details.targetCompletionDate,
        implementingOffice: details.implementingOffice,
        fundingSource: details.fundingSource,
        contractorName: details.contractorName,
        contractCost: details.contractCost,
        updates,
      };
    },
  };
}
