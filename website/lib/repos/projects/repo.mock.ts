import { PROJECT_UPDATES_TABLE } from "@/mocks/fixtures/projects/project-updates-table.fixture";
import { AIPS_TABLE } from "@/mocks/fixtures/aip/aips.table.fixture";
import type { ProjectBundle, ProjectsRepo, UiProject } from "./repo";
import { inferKind, mapProjectRowToUiModel } from "./mappers";
import {
  MOCK_HEALTH_DETAILS_ROWS,
  MOCK_INFRA_DETAILS_ROWS,
  MOCK_PROJECTS_ROWS,
} from "@/mocks/fixtures/projects/projects.mock.fixture";
import type { ProjectReadOptions } from "./types";

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

function normalizeBarangayScopeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\bbarangay\b/g, " ")
    .replace(/\bbrgy\.?\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function hasBarangayScopeHint(options?: ProjectReadOptions): boolean {
  if (!options) return false;
  return options.barangayId !== undefined || options.barangayScopeName !== undefined;
}

function hasCityScopeHint(options?: ProjectReadOptions): boolean {
  if (!options) return false;
  return options.cityId !== undefined || options.cityScopeName !== undefined;
}

function resolveMockVisibleAipIds(options?: ProjectReadOptions): Set<string> | null {
  const enforcePublishedOnly = options?.publishedOnly === true;
  const hasBarangayScope = hasBarangayScopeHint(options);
  const hasCityScope = hasCityScopeHint(options);
  const scoped = hasBarangayScope || hasCityScope;

  if (!enforcePublishedOnly && !scoped) return null;

  let candidates = AIPS_TABLE;
  if (enforcePublishedOnly) {
    candidates = candidates.filter((aip) => aip.status === "published");
  }

  if (!scoped) {
    return new Set(candidates.map((aip) => aip.id));
  }

  if (hasBarangayScope) {
    const rawName =
      typeof options?.barangayScopeName === "string"
        ? options.barangayScopeName.trim()
        : "";
    if (!rawName) return new Set<string>();

    const normalizedScopeName = normalizeBarangayScopeName(rawName);
    const matchedAipIds = candidates
      .filter((aip) => {
        if (aip.scope !== "barangay" || !aip.barangayName) return false;
        return normalizeBarangayScopeName(aip.barangayName) === normalizedScopeName;
      })
      .map((aip) => aip.id);

    return new Set(matchedAipIds);
  }

  if (hasCityScope) {
    const rawCityScopeName =
      typeof options?.cityScopeName === "string"
        ? options.cityScopeName.trim().toLowerCase()
        : "";
    const hasExplicitCityId = Boolean(options?.cityId);

    if (!hasExplicitCityId && !rawCityScopeName) {
      return new Set<string>();
    }

    const matchedAipIds = candidates
      .filter((aip) => {
        if (aip.scope !== "city") return false;
        if (!rawCityScopeName) return true;
        return aip.title.toLowerCase().includes(rawCityScopeName);
      })
      .map((aip) => aip.id);

    return new Set(matchedAipIds);
  }

  return new Set<string>();
}

function applyMockReadOptions<T extends { aip_id: string }>(
  rows: T[],
  visibleAipIds: Set<string> | null
): T[] {
  if (!visibleAipIds) return rows;
  if (visibleAipIds.size === 0) return [];
  return rows.filter((row) => visibleAipIds.has(row.aip_id));
}

export function createMockProjectsRepoImpl(): ProjectsRepo {
  return {
    async listByAip(aipId: string, options?: ProjectReadOptions): Promise<UiProject[]> {
      const visibleAipIds = resolveMockVisibleAipIds(options);
      const projects = applyMockReadOptions(
        MOCK_PROJECTS_ROWS.filter((row) => row.aip_id === aipId),
        visibleAipIds
      );
      return projects.map((row) => {
        const kind = inferKind(row);
        const health = kind === "health" ? getHealthDetails(row.id) : null;
        const infra = kind === "infrastructure" ? getInfraDetails(row.id) : null;
        const mapped = mapProjectRowToUiModel(row, health, infra, {
          status: row.status ?? null,
          imageUrl: row.image_url ?? null,
        });
        return attachUpdates(mapped);
      });
    },

    async getById(projectId: string, options?: ProjectReadOptions): Promise<UiProject | null> {
      const visibleAipIds = resolveMockVisibleAipIds(options);
      const row = MOCK_PROJECTS_ROWS.find((project) => project.id === projectId);
      if (!row) return null;
      if (visibleAipIds && !visibleAipIds.has(row.aip_id)) return null;

      const kind = inferKind(row);
      const health = kind === "health" ? getHealthDetails(row.id) : null;
      const infra = kind === "infrastructure" ? getInfraDetails(row.id) : null;
      const mapped = mapProjectRowToUiModel(row, health, infra, {
        status: row.status ?? null,
        imageUrl: row.image_url ?? null,
      });
      return attachUpdates(mapped);
    },

    async listHealth(options?: ProjectReadOptions) {
      const visibleAipIds = resolveMockVisibleAipIds(options);
      const rows = applyMockReadOptions(
        MOCK_PROJECTS_ROWS.filter((row) => inferKind(row) === "health"),
        visibleAipIds
      );
      return rows.map((row) => {
        const details = getHealthDetails(row.id);
        if (!details) {
          throw new Error(`Health details not found for ${row.id}`);
        }
        const mapped = mapProjectRowToUiModel(row, details, null, {
          status: row.status ?? null,
          imageUrl: row.image_url ?? null,
        });
        if (mapped.kind !== "health") {
          throw new Error(`Expected health project mapping for ${row.id}`);
        }
        return attachUpdates(mapped);
      });
    },

    async listInfrastructure(options?: ProjectReadOptions) {
      const visibleAipIds = resolveMockVisibleAipIds(options);
      const rows = applyMockReadOptions(
        MOCK_PROJECTS_ROWS.filter((row) => inferKind(row) === "infrastructure"),
        visibleAipIds
      );
      return rows.map((row) => {
        const details = getInfraDetails(row.id);
        if (!details) {
          throw new Error(`Infrastructure details not found for ${row.id}`);
        }
        const mapped = mapProjectRowToUiModel(row, null, details, {
          status: row.status ?? null,
          imageUrl: row.image_url ?? null,
        });
        if (mapped.kind !== "infrastructure") {
          throw new Error(`Expected infrastructure project mapping for ${row.id}`);
        }
        return attachUpdates(mapped);
      });
    },

    async getByRefCode(
      projectRefCode: string,
      options?: ProjectReadOptions
    ): Promise<ProjectBundle | null> {
      const project = await this.getById(projectRefCode, options);
      if (!project) return null;
      if (project.kind !== "health" && project.kind !== "infrastructure") {
        return null;
      }
      return project as ProjectBundle;
    },
  };
}
