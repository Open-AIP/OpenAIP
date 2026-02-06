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

// [DATAFLOW] Mock adapter implementing `ProjectsRepo` (dev only).
// [DBV2] Supabase adapter should query `public.projects` + detail tables and respect visibility via `can_read_aip` / `can_edit_aip` (RLS).

import { PROJECT_UPDATES_TABLE } from "../mock/project-updates-table";
import type { ProjectBundle } from "../types";
import { inferKind, mapProjectRowToUiModel } from "./mappers/project.mapper";
import {
  MOCK_HEALTH_DETAILS_ROWS,
  MOCK_INFRA_DETAILS_ROWS,
  MOCK_PROJECTS_ROWS,
} from "./mocks/projects.mock";
import type { ProjectsRepo, UiProject } from "./types";

function attachUpdates<T extends UiProject>(project: T): T {
  const updates = PROJECT_UPDATES_TABLE.filter(
    (u) => u.projectRefCode === project.id
  );
  return { ...project, updates };
}

function getHealthDetails(projectId: string) {
  return MOCK_HEALTH_DETAILS_ROWS.find((row) => row.project_id === projectId) ?? null;
}

function getInfraDetails(projectId: string) {
  return MOCK_INFRA_DETAILS_ROWS.find((row) => row.project_id === projectId) ?? null;
}

export function createMockProjectsRepoImpl(): ProjectsRepo {
  return {
    async listByAip(aipId: string): Promise<UiProject[]> {
      const projects = MOCK_PROJECTS_ROWS.filter((row) => row.aip_id === aipId);
      return projects.map((row) => {
        const kind = inferKind(row);
        const health = kind === "health" ? getHealthDetails(row.id) : null;
        const infra = kind === "infrastructure" ? getInfraDetails(row.id) : null;
        const mapped = mapProjectRowToUiModel(row, health, infra);
        return attachUpdates(mapped);
      });
    },

    async getById(projectId: string): Promise<UiProject | null> {
      const row = MOCK_PROJECTS_ROWS.find((project) => project.id === projectId);
      if (!row) return null;
      const kind = inferKind(row);
      const health = kind === "health" ? getHealthDetails(row.id) : null;
      const infra = kind === "infrastructure" ? getInfraDetails(row.id) : null;
      const mapped = mapProjectRowToUiModel(row, health, infra);
      return attachUpdates(mapped);
    },

    async listHealth() {
      const rows = MOCK_PROJECTS_ROWS.filter(
        (row) => inferKind(row) === "health"
      );
      return rows.map((row) => {
        const details = getHealthDetails(row.id);
        if (!details) {
          throw new Error(`Health details not found for ${row.id}`);
        }
        const mapped = mapProjectRowToUiModel(row, details, null);
        return attachUpdates(mapped as any);
      });
    },

    async listInfrastructure() {
      const rows = MOCK_PROJECTS_ROWS.filter(
        (row) => inferKind(row) === "infrastructure"
      );
      return rows.map((row) => {
        const details = getInfraDetails(row.id);
        if (!details) {
          throw new Error(`Infrastructure details not found for ${row.id}`);
        }
        const mapped = mapProjectRowToUiModel(row, null, details);
        return attachUpdates(mapped as any);
      });
    },

    async getByRefCode(projectRefCode: string): Promise<ProjectBundle | null> {
      const project = await this.getById(projectRefCode);
      if (!project) return null;
      if (project.kind !== "health" && project.kind !== "infrastructure") {
        return null;
      }
      return project as ProjectBundle;
    },
  };
}
