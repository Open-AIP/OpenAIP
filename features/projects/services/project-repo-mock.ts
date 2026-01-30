/**
 * ============================================================================
 * PROJECTS FEATURE - MOCK DATA REPOSITORY
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

import {
  PROJECTS_MASTER,
  HEALTH_DETAILS,
  INFRASTRUCTURE_DETAILS,
  PROJECT_UPDATES,
} from "../mocks";
import type { HealthProject, InfrastructureProject, ProjectBundle } from "../types";

/**
 * Mock Project Repository
 */
export function createMockProjectsRepo() {
  return {
    async listHealth(): Promise<HealthProject[]> {
      const healthMasters = PROJECTS_MASTER.filter((p) => p.kind === "health");
      
      return healthMasters.map((master) => {
        const details = HEALTH_DETAILS.find(
          (d) => d.projectRefCode === master.projectRefCode
        );
        const updates = PROJECT_UPDATES.filter(
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
      const infraMasters = PROJECTS_MASTER.filter((p) => p.kind === "infrastructure");
      
      return infraMasters.map((master) => {
        const details = INFRASTRUCTURE_DETAILS.find(
          (d) => d.projectRefCode === master.projectRefCode
        );
        const updates = PROJECT_UPDATES.filter(
          (u) => u.projectRefCode === master.projectRefCode
        );

        if (!details) {
          throw new Error(`Infrastructure details not found for ${master.projectRefCode}`);
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
      const master = PROJECTS_MASTER.find((p) => p.projectRefCode === projectRefCode);
      
      if (!master) {
        return null;
      }

      const updates = PROJECT_UPDATES.filter(
        (u) => u.projectRefCode === projectRefCode
      );

      if (master.kind === "health") {
        const details = HEALTH_DETAILS.find(
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
      } else {
        const details = INFRASTRUCTURE_DETAILS.find(
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
      }
    },
  };
}

// Export singleton instance
export const projectRepository = createMockProjectsRepo();
