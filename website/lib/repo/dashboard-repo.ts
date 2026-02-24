import "server-only";

import { supabaseServer } from "@/lib/supabase/server";
import type {
  DashboardAip,
  DashboardData,
  DashboardFeedback,
  DashboardProject,
  DashboardReview,
  DashboardRun,
  DashboardScope,
  DashboardSector,
} from "@/features/dashboard/types/dashboard-types";

type AipRow = {
  id: string;
  fiscal_year: number;
  status: DashboardAip["status"];
  status_updated_at: string;
  submitted_at: string | null;
  published_at: string | null;
  created_at: string;
};

type ProjectRow = {
  id: string;
  aip_id: string;
  aip_ref_code: string;
  program_project_description: string;
  category: DashboardProject["category"];
  sector_code: string;
  total: number | null;
  personal_services: number | null;
  maintenance_and_other_operating_expenses: number | null;
  capital_outlay: number | null;
  errors: unknown;
  is_human_edited: boolean;
  edited_at: string | null;
};

type HealthDetailsRow = { project_id: string; program_name: string };
type SectorRow = { code: string; label: string };

type RunRow = {
  id: string;
  aip_id: string;
  stage: DashboardRun["stage"];
  status: DashboardRun["status"];
  started_at: string | null;
  finished_at: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
};

type ReviewRow = {
  id: string;
  aip_id: string;
  action: DashboardReview["action"];
  note: string | null;
  reviewer_id: string;
  created_at: string;
};

type FeedbackRow = {
  id: string;
  target_type: DashboardFeedback["targetType"];
  aip_id: string | null;
  project_id: string | null;
  parent_feedback_id: string | null;
  kind: DashboardFeedback["kind"];
  body: string;
  created_at: string;
};

function mapAipRow(row: AipRow): DashboardAip {
  return {
    id: row.id,
    fiscalYear: row.fiscal_year,
    status: row.status,
    statusUpdatedAt: row.status_updated_at,
    submittedAt: row.submitted_at,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

function mapProjectRow(row: ProjectRow, healthProgramName: string | null): DashboardProject {
  return {
    id: row.id,
    aipId: row.aip_id,
    aipRefCode: row.aip_ref_code,
    programProjectDescription: row.program_project_description,
    category: row.category,
    sectorCode: row.sector_code,
    total: row.total,
    personalServices: row.personal_services,
    maintenanceAndOtherOperatingExpenses: row.maintenance_and_other_operating_expenses,
    capitalOutlay: row.capital_outlay,
    errors: row.errors,
    isHumanEdited: row.is_human_edited,
    editedAt: row.edited_at,
    healthProgramName,
  };
}

function mapRunRow(row: RunRow): DashboardRun {
  return {
    id: row.id,
    aipId: row.aip_id,
    stage: row.stage,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

function mapReviewRow(row: ReviewRow): DashboardReview {
  return {
    id: row.id,
    aipId: row.aip_id,
    action: row.action,
    note: row.note,
    reviewerId: row.reviewer_id,
    createdAt: row.created_at,
  };
}

function mapFeedbackRow(row: FeedbackRow): DashboardFeedback {
  return {
    id: row.id,
    targetType: row.target_type,
    aipId: row.aip_id,
    projectId: row.project_id,
    parentFeedbackId: row.parent_feedback_id,
    kind: row.kind,
    body: row.body,
    createdAt: row.created_at,
  };
}

async function listAipsByScope(scope: DashboardScope, scopeId: string): Promise<DashboardAip[]> {
  const client = await supabaseServer();
  const scopeColumn = scope === "city" ? "city_id" : "barangay_id";
  const { data, error } = await client
    .from("aips")
    .select("id,fiscal_year,status,status_updated_at,submitted_at,published_at,created_at")
    .eq(scopeColumn, scopeId)
    .order("fiscal_year", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as AipRow[]).map(mapAipRow);
}

async function getScopeAip(scope: DashboardScope, scopeId: string, fiscalYear: number): Promise<DashboardAip | null> {
  const client = await supabaseServer();
  const scopeColumn = scope === "city" ? "city_id" : "barangay_id";
  const { data, error } = await client
    .from("aips")
    .select("id,fiscal_year,status,status_updated_at,submitted_at,published_at,created_at")
    .eq(scopeColumn, scopeId)
    .eq("fiscal_year", fiscalYear)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapAipRow(data as AipRow) : null;
}

async function listProjects(aipId: string): Promise<DashboardProject[]> {
  const client = await supabaseServer();
  const { data, error } = await client
    .from("projects")
    .select(
      "id,aip_id,aip_ref_code,program_project_description,category,sector_code,total,personal_services,maintenance_and_other_operating_expenses,capital_outlay,errors,is_human_edited,edited_at"
    )
    .eq("aip_id", aipId);

  if (error) throw new Error(error.message);
  const projects = (data ?? []) as ProjectRow[];
  const projectIds = projects.map((project) => project.id);

  let healthByProjectId = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: healthData, error: healthError } = await client
      .from("health_project_details")
      .select("project_id,program_name")
      .in("project_id", projectIds);
    if (healthError) throw new Error(healthError.message);
    healthByProjectId = new Map(((healthData ?? []) as HealthDetailsRow[]).map((row) => [row.project_id, row.program_name]));
  }

  return projects.map((project) => mapProjectRow(project, healthByProjectId.get(project.id) ?? null));
}

async function listSectors(): Promise<DashboardSector[]> {
  const client = await supabaseServer();
  const { data, error } = await client.from("sectors").select("code,label").order("code");
  if (error) throw new Error(error.message);
  return ((data ?? []) as SectorRow[]).map((row) => ({ code: row.code, label: row.label }));
}

async function listLatestRuns(aipId: string): Promise<DashboardRun[]> {
  const client = await supabaseServer();
  const { data, error } = await client
    .from("extraction_runs")
    .select("id,aip_id,stage,status,started_at,finished_at,error_code,error_message,created_at")
    .eq("aip_id", aipId)
    .order("started_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const runs = ((data ?? []) as RunRow[]).map(mapRunRow);
  const latestByStage = new Map<DashboardRun["stage"], DashboardRun>();

  for (const run of runs) {
    if (!latestByStage.has(run.stage)) {
      latestByStage.set(run.stage, run);
    }
  }

  return Array.from(latestByStage.values());
}

async function listAipReviews(aipId: string): Promise<DashboardReview[]> {
  const client = await supabaseServer();
  const { data, error } = await client
    .from("aip_reviews")
    .select("id,aip_id,action,note,reviewer_id,created_at")
    .eq("aip_id", aipId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ReviewRow[]).map(mapReviewRow);
}

async function listFeedback(aipId: string, projectIds: string[]): Promise<DashboardFeedback[]> {
  const client = await supabaseServer();
  const { data: aipFeedback, error: aipFeedbackError } = await client
    .from("feedback")
    .select("id,target_type,aip_id,project_id,parent_feedback_id,kind,body,created_at")
    .eq("target_type", "aip")
    .eq("aip_id", aipId);
  if (aipFeedbackError) throw new Error(aipFeedbackError.message);

  const rows: FeedbackRow[] = [...((aipFeedback ?? []) as FeedbackRow[])];

  if (projectIds.length > 0) {
    const { data: projectFeedback, error: projectFeedbackError } = await client
      .from("feedback")
      .select("id,target_type,aip_id,project_id,parent_feedback_id,kind,body,created_at")
      .eq("target_type", "project")
      .in("project_id", projectIds);
    if (projectFeedbackError) throw new Error(projectFeedbackError.message);
    rows.push(...((projectFeedback ?? []) as FeedbackRow[]));
  }

  return rows.map(mapFeedbackRow);
}

function resolveDefaultYear(aips: DashboardAip[]): number {
  if (aips.length > 0) return aips[0].fiscalYear;
  return new Date().getFullYear();
}

export async function getDashboardDataByScope(input: {
  scope: DashboardScope;
  scopeId: string;
  requestedFiscalYear?: number | null;
}): Promise<DashboardData> {
  const allAips = await listAipsByScope(input.scope, input.scopeId);
  const availableFiscalYears = Array.from(new Set(allAips.map((aip) => aip.fiscalYear))).sort((left, right) => right - left);
  const selectedFiscalYear = input.requestedFiscalYear ?? resolveDefaultYear(allAips);
  const selectedAip = await getScopeAip(input.scope, input.scopeId, selectedFiscalYear);

  if (!selectedAip) {
    return {
      scope: input.scope,
      scopeId: input.scopeId,
      selectedFiscalYear,
      selectedAip: null,
      availableFiscalYears,
      allAips,
      projects: [],
      sectors: await listSectors(),
      latestRuns: [],
      reviews: [],
      feedback: [],
    };
  }

  const projects = await listProjects(selectedAip.id);
  const projectIds = projects.map((project) => project.id);
  const [sectors, latestRuns, reviews, feedback] = await Promise.all([
    listSectors(),
    listLatestRuns(selectedAip.id),
    listAipReviews(selectedAip.id),
    listFeedback(selectedAip.id, projectIds),
  ]);

  return {
    scope: input.scope,
    scopeId: input.scopeId,
    selectedFiscalYear,
    selectedAip,
    availableFiscalYears,
    allAips,
    projects,
    sectors,
    latestRuns,
    reviews,
    feedback,
  };
}

export async function createDraftAip(input: {
  scope: DashboardScope;
  scopeId: string;
  fiscalYear: number;
  createdBy: string;
}) {
  const client = await supabaseServer();
  const scopeColumn = input.scope === "city" ? "city_id" : "barangay_id";
  const { data: existing, error: existingError } = await client
    .from("aips")
    .select("id")
    .eq(scopeColumn, input.scopeId)
    .eq("fiscal_year", input.fiscalYear)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing) return;

  const payload: Record<string, unknown> = {
    fiscal_year: input.fiscalYear,
    status: "draft",
    created_by: input.createdBy,
    barangay_id: null,
    city_id: null,
    municipality_id: null,
  };

  payload[scopeColumn] = input.scopeId;

  const { error } = await client.from("aips").insert(payload);
  if (error) throw new Error(error.message);
}

export async function replyToFeedback(input: {
  parentFeedbackId: string;
  body: string;
  authorId: string;
}) {
  const client = await supabaseServer();
  const { data: parent, error: parentError } = await client
    .from("feedback")
    .select("id,target_type,aip_id,project_id")
    .eq("id", input.parentFeedbackId)
    .maybeSingle();

  if (parentError) throw new Error(parentError.message);
  if (!parent) throw new Error("Feedback parent not found.");

  const targetType = parent.target_type as "aip" | "project";

  const { error } = await client.from("feedback").insert({
    target_type: targetType,
    aip_id: targetType === "aip" ? ((parent.aip_id as string | null) ?? null) : null,
    project_id: targetType === "project" ? ((parent.project_id as string | null) ?? null) : null,
    parent_feedback_id: input.parentFeedbackId,
    source: "human",
    kind: "lgu_note",
    extraction_run_id: null,
    extraction_artifact_id: null,
    field_key: null,
    severity: null,
    body: input.body,
    is_public: true,
    author_id: input.authorId,
  });

  if (error) throw new Error(error.message);
}
