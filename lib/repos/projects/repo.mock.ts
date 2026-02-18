import { PROJECT_UPDATES_TABLE } from "@/mocks/fixtures/projects/project-updates-table.fixture";
import type { ProjectBundle, ProjectsRepo, UiProject } from "./repo";
import { inferKind, mapProjectRowToUiModel } from "./mappers";
import {
  MOCK_HEALTH_DETAILS_ROWS,
  MOCK_INFRA_DETAILS_ROWS,
  MOCK_PROJECTS_ROWS,
} from "@/mocks/fixtures/projects/projects.mock.fixture";

function attachUpdates<T extends UiProject>(project: T): T {
  const updates = PROJECT_UPDATES_TABLE.filter((u) => u.projectRefCode === project.id);
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
        const mapped = mapProjectRowToUiModel(row, health, infra, {
          status: row.ui_status ?? null,
          imageUrl: row.image_url ?? null,
        });
        return attachUpdates(mapped);
      });
    },

    async getById(projectId: string): Promise<UiProject | null> {
      const row = MOCK_PROJECTS_ROWS.find((project) => project.id === projectId);
      if (!row) return null;
      const kind = inferKind(row);
      const health = kind === "health" ? getHealthDetails(row.id) : null;
      const infra = kind === "infrastructure" ? getInfraDetails(row.id) : null;
      const mapped = mapProjectRowToUiModel(row, health, infra, {
        status: row.ui_status ?? null,
        imageUrl: row.image_url ?? null,
      });
      return attachUpdates(mapped);
    },

    async listHealth() {
      const rows = MOCK_PROJECTS_ROWS.filter((row) => inferKind(row) === "health");
      return rows.map((row) => {
        const details = getHealthDetails(row.id);
        if (!details) {
          throw new Error(`Health details not found for ${row.id}`);
        }
        const mapped = mapProjectRowToUiModel(row, details, null, {
          status: row.ui_status ?? null,
          imageUrl: row.image_url ?? null,
        });
        if (mapped.kind !== "health") {
          throw new Error(`Expected health project mapping for ${row.id}`);
        }
        return attachUpdates(mapped);
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
        const mapped = mapProjectRowToUiModel(row, null, details, {
          status: row.ui_status ?? null,
          imageUrl: row.image_url ?? null,
        });
        if (mapped.kind !== "infrastructure") {
          throw new Error(`Expected infrastructure project mapping for ${row.id}`);
        }
        return attachUpdates(mapped);
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
