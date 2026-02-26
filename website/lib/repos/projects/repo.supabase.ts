import "server-only";

import { supabaseServer } from "@/lib/supabase/server";
import type {
  HealthProjectDetailsRow,
  InfrastructureProjectDetailsRow,
  ProjectRow,
} from "./db.types";
import { mapProjectRowToUiModel } from "./mappers";
import type { ProjectsRepo } from "./repo";
import type {
  HealthProject,
  InfrastructureProject,
  ProjectReadOptions,
  ProjectBundle,
  ProjectStatus,
  UiProject,
} from "./types";

type ProjectRowWithMeta = ProjectRow & {
  status?: ProjectStatus | null;
  image_url?: string | null;
};

type AipScopeRow = {
  id: string;
};

const PROJECT_SELECT_COLUMNS = [
  "id",
  "aip_id",
  "extraction_artifact_id",
  "aip_ref_code",
  "program_project_description",
  "implementing_agency",
  "start_date",
  "completion_date",
  "expected_output",
  "source_of_funds",
  "personal_services",
  "maintenance_and_other_operating_expenses",
  "financial_expenses",
  "capital_outlay",
  "total",
  "climate_change_adaptation",
  "climate_change_mitigation",
  "cc_topology_code",
  "prm_ncr_lgu_rm_objective_results_indicator",
  "errors",
  "category",
  "sector_code",
  "is_human_edited",
  "edited_by",
  "edited_at",
  "created_at",
  "updated_at",
].join(",");

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function attachUpdates<T extends UiProject>(project: T): T {
  return {
    ...project,
    updates: [],
  };
}

function hasBarangayScopeHint(options?: ProjectReadOptions): boolean {
  if (!options) return false;
  return options.barangayId !== undefined || options.barangayScopeName !== undefined;
}

async function resolveReadableAipIds(
  client: Awaited<ReturnType<typeof supabaseServer>>,
  options?: ProjectReadOptions
): Promise<Set<string> | null> {
  const enforcePublishedOnly = options?.publishedOnly === true;
  const scoped = hasBarangayScopeHint(options);

  if (!enforcePublishedOnly && !scoped) return null;
  if (scoped && !options?.barangayId) return new Set<string>();

  let query = client.from("aips").select("id");

  if (enforcePublishedOnly) {
    query = query.eq("status", "published");
  }

  if (options?.barangayId) {
    query = query.eq("barangay_id", options.barangayId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return new Set(((data ?? []) as AipScopeRow[]).map((row) => row.id));
}

async function loadDetailsByProjectIds(projectIds: string[]) {
  const healthByProjectId = new Map<string, HealthProjectDetailsRow>();
  const infraByProjectId = new Map<string, InfrastructureProjectDetailsRow>();

  if (projectIds.length === 0) {
    return { healthByProjectId, infraByProjectId };
  }

  const client = await supabaseServer();
  const [healthResult, infraResult] = await Promise.all([
    client
      .from("health_project_details")
      .select(
        "project_id,program_name,description,target_participants,total_target_participants,updated_by,updated_at,created_at"
      )
      .in("project_id", projectIds),
    client
      .from("infrastructure_project_details")
      .select(
        "project_id,project_name,contractor_name,contract_cost,start_date,target_completion_date,updated_by,updated_at,created_at"
      )
      .in("project_id", projectIds),
  ]);

  if (healthResult.error) {
    throw new Error(healthResult.error.message);
  }

  if (infraResult.error) {
    throw new Error(infraResult.error.message);
  }

  for (const row of (healthResult.data ?? []) as HealthProjectDetailsRow[]) {
    healthByProjectId.set(row.project_id, row);
  }

  for (const row of (infraResult.data ?? []) as InfrastructureProjectDetailsRow[]) {
    infraByProjectId.set(row.project_id, row);
  }

  return { healthByProjectId, infraByProjectId };
}

function mapProjectToUiModel(
  row: ProjectRowWithMeta,
  details: {
    healthByProjectId: Map<string, HealthProjectDetailsRow>;
    infraByProjectId: Map<string, InfrastructureProjectDetailsRow>;
  }
): UiProject {
  const health = details.healthByProjectId.get(row.id) ?? null;
  const infra = details.infraByProjectId.get(row.id) ?? null;

  const mapped = mapProjectRowToUiModel(row, health, infra, {
    status: row.status ?? null,
    imageUrl: row.image_url ?? null,
  });

  return attachUpdates(mapped);
}

async function listProjectsInternal(input?: {
  aipId?: string;
  category?: "health" | "infrastructure";
  options?: ProjectReadOptions;
}): Promise<UiProject[]> {
  const client = await supabaseServer();
  const scopedAipIds = await resolveReadableAipIds(client, input?.options);
  if (scopedAipIds && scopedAipIds.size === 0) {
    return [];
  }

  let query = client.from("projects").select(PROJECT_SELECT_COLUMNS);

  if (input?.aipId) {
    query = query.eq("aip_id", input.aipId);
  }

  if (input?.category) {
    query = query.eq("category", input.category);
  }

  if (scopedAipIds) {
    query = query.in("aip_id", Array.from(scopedAipIds));
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as ProjectRowWithMeta[];
  const details = await loadDetailsByProjectIds(rows.map((row) => row.id));

  return rows.map((row) => mapProjectToUiModel(row, details));
}

async function getProjectByRefOrId(
  projectIdOrRefCode: string,
  options?: ProjectReadOptions
): Promise<UiProject | null> {
  const client = await supabaseServer();
  const scopedAipIds = await resolveReadableAipIds(client, options);
  if (scopedAipIds && scopedAipIds.size === 0) {
    return null;
  }

  let row: ProjectRowWithMeta | null = null;

  if (isUuid(projectIdOrRefCode)) {
    const byId = await client
      .from("projects")
      .select(PROJECT_SELECT_COLUMNS)
      .eq("id", projectIdOrRefCode)
      .maybeSingle();

    if (byId.error) {
      throw new Error(byId.error.message);
    }

    row = (byId.data as ProjectRowWithMeta | null) ?? null;
  }

  if (!row) {
    const byRefCode = await client
      .from("projects")
      .select(PROJECT_SELECT_COLUMNS)
      .eq("aip_ref_code", projectIdOrRefCode)
      .maybeSingle();

    if (byRefCode.error) {
      throw new Error(byRefCode.error.message);
    }

    row = (byRefCode.data as ProjectRowWithMeta | null) ?? null;
  }

  if (!row) {
    return null;
  }

  if (scopedAipIds && !scopedAipIds.has(row.aip_id)) {
    return null;
  }

  const details = await loadDetailsByProjectIds([row.id]);
  return mapProjectToUiModel(row, details);
}

export function createSupabaseProjectsRepo(): ProjectsRepo {
  return {
    async listByAip(aipId: string, options?: ProjectReadOptions): Promise<UiProject[]> {
      return listProjectsInternal({ aipId, options });
    },

    async getById(projectId: string, options?: ProjectReadOptions): Promise<UiProject | null> {
      return getProjectByRefOrId(projectId, options);
    },

    async listHealth(options?: ProjectReadOptions): Promise<HealthProject[]> {
      const projects = await listProjectsInternal({ category: "health", options });
      return projects.filter((project) => project.kind === "health") as HealthProject[];
    },

    async listInfrastructure(options?: ProjectReadOptions): Promise<InfrastructureProject[]> {
      const projects = await listProjectsInternal({ category: "infrastructure", options });
      return projects.filter((project) => project.kind === "infrastructure") as InfrastructureProject[];
    },

    async getByRefCode(
      projectRefCode: string,
      options?: ProjectReadOptions
    ): Promise<ProjectBundle | null> {
      const project = await getProjectByRefOrId(projectRefCode, options);
      if (!project) return null;
      if (project.kind !== "health" && project.kind !== "infrastructure") {
        return null;
      }
      return project as ProjectBundle;
    },
  };
}
