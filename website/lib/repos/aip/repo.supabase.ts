import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import type { Json } from "@/lib/contracts/databasev2";
import type { AipProjectRepo, AipRepo } from "./repo";
import type { AipHeader } from "./types";

type ScopeRow = { name: string | null } | null;

type AipSelectRow = {
  id: string;
  fiscal_year: number;
  status: "draft" | "pending_review" | "under_review" | "for_revision" | "published";
  created_at: string;
  published_at: string | null;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
  barangay: ScopeRow | ScopeRow[];
  city: ScopeRow | ScopeRow[];
  municipality: ScopeRow | ScopeRow[];
};

type UploadedFileSelectRow = {
  id: string;
  aip_id: string;
  bucket_id: string;
  object_name: string;
  original_file_name: string | null;
  uploaded_by: string;
  created_at: string;
  is_current: boolean;
};

type ArtifactSelectRow = {
  aip_id: string;
  artifact_json: Json | null;
  artifact_text: string | null;
  created_at: string;
};

type ProjectSelectRow = {
  id: string;
  aip_id: string;
  aip_ref_code: string;
  program_project_description: string;
  total: number | null;
  category: "health" | "infrastructure" | "other";
  sector_code: string;
  errors: Json | null;
};

type AipReviewNoteRow = {
  aip_id: string;
  note: string | null;
  created_at: string;
};

type ExtractionRunSelectRow = {
  id: string;
  aip_id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  overall_progress_pct: number | null;
  progress_message: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  role:
    | "citizen"
    | "barangay_official"
    | "city_official"
    | "municipal_official"
    | "admin";
};

type ViewerScope = {
  role:
    | "citizen"
    | "barangay_official"
    | "city_official"
    | "municipal_official"
    | "admin";
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
};

function toDateOnly(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function scopeNameOf(scope: ScopeRow | ScopeRow[] | undefined): string | null {
  if (!scope) return null;
  if (Array.isArray(scope)) return scope[0]?.name ?? null;
  return scope.name ?? null;
}

function toPrettyDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function basename(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx >= 0 ? path.slice(idx + 1) : path;
}

function roleLabel(role: ProfileRow["role"]): string {
  if (role === "barangay_official") return "Barangay Official";
  if (role === "city_official") return "City Official";
  if (role === "municipal_official") return "Municipal Official";
  if (role === "admin") return "Admin";
  return "Citizen";
}

function toSectorLabel(sectorCode: string): "General Sector" | "Social Sector" | "Economic Sector" | "Other Services" | "Unknown" {
  if (sectorCode.startsWith("1000")) return "General Sector";
  if (sectorCode.startsWith("3000")) return "Social Sector";
  if (sectorCode.startsWith("8000")) return "Economic Sector";
  if (sectorCode.startsWith("9000")) return "Other Services";
  return "Unknown";
}

function parseSummary(row: ArtifactSelectRow | undefined): string | undefined {
  if (!row) return undefined;
  if (typeof row.artifact_text === "string" && row.artifact_text.trim()) {
    return row.artifact_text.trim();
  }
  if (row.artifact_json && typeof row.artifact_json === "object" && !Array.isArray(row.artifact_json)) {
    const candidate = (row.artifact_json as Record<string, unknown>).summary;
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return undefined;
}

const FINALIZING_PROGRESS_MESSAGE = "Finalizing processed output...";

function clampProgress(value: number | null | undefined, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function toProgressMessage(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const message = value.trim();
  return message ? message : null;
}

function buildAipProcessing(input: {
  run: ExtractionRunSelectRow | undefined;
  summary: string | undefined;
}): AipHeader["processing"] | undefined {
  const { run, summary } = input;
  if (!run) return undefined;

  if (run.status === "queued" || run.status === "running") {
    return {
      state: "processing",
      overallProgressPct: clampProgress(run.overall_progress_pct, 0),
      message: toProgressMessage(run.progress_message),
      runId: run.id,
    };
  }

  if (run.status === "succeeded" && !summary) {
    return {
      state: "finalizing",
      overallProgressPct: 100,
      message: toProgressMessage(run.progress_message) ?? FINALIZING_PROGRESS_MESSAGE,
      runId: run.id,
    };
  }

  return undefined;
}

async function getViewerScope(): Promise<ViewerScope | null> {
  const client = await supabaseServer();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user?.id) return null;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role,barangay_id,city_id,municipality_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile) return null;
  return profile as ViewerScope;
}

async function getProfilesByIds(userIds: string[]): Promise<Map<string, ProfileRow>> {
  if (!userIds.length) return new Map();
  const client = await supabaseServer();
  const { data, error } = await client
    .from("profiles")
    .select("id,full_name,role")
    .in("id", userIds);
  if (error) throw new Error(error.message);
  return new Map((data as ProfileRow[]).map((r) => [r.id, r]));
}

async function getLatestSummaries(aipIds: string[]): Promise<Map<string, ArtifactSelectRow>> {
  if (!aipIds.length) return new Map();
  const client = await supabaseServer();
  const { data, error } = await client
    .from("extraction_artifacts")
    .select("aip_id,artifact_json,artifact_text,created_at")
    .eq("artifact_type", "summarize")
    .in("aip_id", aipIds)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const map = new Map<string, ArtifactSelectRow>();
  for (const row of (data ?? []) as ArtifactSelectRow[]) {
    if (!map.has(row.aip_id)) map.set(row.aip_id, row);
  }
  return map;
}

async function getCurrentFiles(aipIds: string[]): Promise<Map<string, UploadedFileSelectRow>> {
  if (!aipIds.length) return new Map();
  const client = await supabaseServer();
  const { data, error } = await client
    .from("uploaded_files")
    .select("id,aip_id,bucket_id,object_name,original_file_name,uploaded_by,created_at,is_current")
    .eq("is_current", true)
    .in("aip_id", aipIds)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const map = new Map<string, UploadedFileSelectRow>();
  for (const row of (data ?? []) as UploadedFileSelectRow[]) {
    if (!map.has(row.aip_id)) map.set(row.aip_id, row);
  }
  return map;
}

async function getProjectsByAipIds(aipIds: string[]): Promise<Map<string, ProjectSelectRow[]>> {
  const map = new Map<string, ProjectSelectRow[]>();
  if (!aipIds.length) return map;

  const client = await supabaseServer();
  const { data, error } = await client
    .from("projects")
    .select("id,aip_id,aip_ref_code,program_project_description,total,category,sector_code,errors")
    .in("aip_id", aipIds)
    .order("aip_ref_code", { ascending: true });
  if (error) throw new Error(error.message);

  for (const row of (data ?? []) as ProjectSelectRow[]) {
    const list = map.get(row.aip_id) ?? [];
    list.push(row);
    map.set(row.aip_id, list);
  }
  return map;
}

async function getLatestRevisionNotes(aipIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!aipIds.length) return map;
  const client = await supabaseServer();
  const { data, error } = await client
    .from("aip_reviews")
    .select("id,aip_id,action,note,created_at")
    .eq("action", "request_revision")
    .in("aip_id", aipIds)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as AipReviewNoteRow[]) {
    if (!map.has(row.aip_id) && typeof row.note === "string" && row.note.trim()) {
      map.set(row.aip_id, row.note.trim());
    }
  }
  return map;
}

async function getLatestRunsByAipIds(aipIds: string[]): Promise<Map<string, ExtractionRunSelectRow>> {
  const map = new Map<string, ExtractionRunSelectRow>();
  if (!aipIds.length) return map;

  const client = await supabaseServer();
  const { data, error } = await client
    .from("extraction_runs")
    .select("id,aip_id,status,overall_progress_pct,progress_message,created_at")
    .in("aip_id", aipIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as ExtractionRunSelectRow[]) {
    if (!map.has(row.aip_id)) {
      map.set(row.aip_id, row);
    }
  }
  return map;
}

async function createSignedUrl(file: UploadedFileSelectRow | undefined): Promise<string> {
  if (!file) return "";
  const admin = supabaseAdmin();
  const { data, error } = await admin.storage
    .from(file.bucket_id)
    .createSignedUrl(file.object_name, 60 * 10);
  if (error || !data?.signedUrl) return "";
  return data.signedUrl;
}

function buildAipHeader(input: {
  aip: AipSelectRow;
  currentFile?: UploadedFileSelectRow;
  summary?: string;
  projects: ProjectSelectRow[];
  uploader?: ProfileRow;
  pdfUrl?: string;
  revisionNote?: string;
  processing?: AipHeader["processing"];
}) {
  const { aip, currentFile, summary, projects, uploader, pdfUrl, revisionNote, processing } = input;

  const budget = projects.reduce((acc, p) => acc + (p.total ?? 0), 0);
  const sectors = Array.from(new Set(projects.map((p) => toSectorLabel(p.sector_code)).filter((s) => s !== "Unknown")));
  const detailedBullets = projects
    .map((p) => p.program_project_description?.trim())
    .filter((v): v is string => !!v)
    .slice(0, 5);

  const scope: "barangay" | "city" = aip.barangay_id ? "barangay" : "city";
  const scopeName =
    scopeNameOf(aip.barangay) ?? scopeNameOf(aip.city) ?? scopeNameOf(aip.municipality) ?? "LGU";

  const fileName =
    currentFile?.original_file_name?.trim() ||
    (currentFile ? basename(currentFile.object_name) : `AIP_${aip.fiscal_year}.pdf`);

  const uploaderName =
    uploader?.full_name?.trim() ||
    scopeName;
  const uploaderRole = uploader ? roleLabel(uploader.role) : "LGU";
  const uploadedAt = currentFile?.created_at ?? aip.created_at;

  return {
    id: aip.id,
    scope,
    barangayName: scope === "barangay" ? scopeName : undefined,
    title: `Annual Investment Program ${aip.fiscal_year}`,
    description:
      (summary && summary.slice(0, 220)) ||
      `Annual Investment Program for ${scopeName} fiscal year ${aip.fiscal_year}.`,
    year: aip.fiscal_year,
    budget,
    uploadedAt: toDateOnly(uploadedAt),
    publishedAt: aip.published_at ? toDateOnly(aip.published_at) : undefined,
    status: aip.status,
    fileName,
    pdfUrl: pdfUrl ?? "",
    summaryText: summary,
    detailedBullets,
    sectors: sectors.length ? sectors : ["General Sector", "Social Sector", "Economic Sector", "Other Services"],
    uploader: {
      name: uploaderName,
      role: uploaderRole,
      uploadDate: toPrettyDate(uploadedAt),
      budgetAllocated: budget,
    },
    feedback: revisionNote,
    processing,
  };
}

export function createSupabaseAipRepo(): AipRepo {
  return {
    async listVisibleAips(input) {
      const scope = input.scope ?? "barangay";
      const visibility = input.visibility ?? "my";
      const client = await supabaseServer();

      let query = client
        .from("aips")
        .select(
          "id,fiscal_year,status,created_at,published_at,barangay_id,city_id,municipality_id,barangay:barangays!aips_barangay_id_fkey(name),city:cities!aips_city_id_fkey(name),municipality:municipalities!aips_municipality_id_fkey(name)"
        )
        .order("fiscal_year", { ascending: false })
        .order("created_at", { ascending: false });

      if (scope === "barangay") {
        query = query.not("barangay_id", "is", null);
      } else {
        query = query.not("city_id", "is", null);
      }

      if (visibility === "public") {
        query = query.neq("status", "draft");
      } else {
        const viewer = await getViewerScope();
        if (scope === "barangay" && viewer?.barangay_id) {
          query = query.eq("barangay_id", viewer.barangay_id);
        } else if (scope === "city" && viewer?.city_id) {
          query = query.eq("city_id", viewer.city_id);
        }
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const aips = (data ?? []) as AipSelectRow[];
      const aipIds = aips.map((a) => a.id);

      const [filesByAip, projectsByAip, summariesByAip, revisionNotes, latestRunsByAip] = await Promise.all([
        getCurrentFiles(aipIds),
        getProjectsByAipIds(aipIds),
        getLatestSummaries(aipIds),
        getLatestRevisionNotes(aipIds),
        scope === "barangay"
          ? getLatestRunsByAipIds(aipIds)
          : Promise.resolve(new Map<string, ExtractionRunSelectRow>()),
      ]);

      const uploaderIds = Array.from(
        new Set(
          Array.from(filesByAip.values())
            .map((f) => f.uploaded_by)
            .filter(Boolean)
        )
      );
      const profilesById = await getProfilesByIds(uploaderIds);

      return aips.map((aip) => {
        const summary = parseSummary(summariesByAip.get(aip.id));
        const processing =
          scope === "barangay"
            ? buildAipProcessing({
                run: latestRunsByAip.get(aip.id),
                summary,
              })
            : undefined;

        return buildAipHeader({
          aip,
          currentFile: filesByAip.get(aip.id),
          projects: projectsByAip.get(aip.id) ?? [],
          summary,
          uploader: (() => {
            const file = filesByAip.get(aip.id);
            return file ? profilesById.get(file.uploaded_by) : undefined;
          })(),
          revisionNote: revisionNotes.get(aip.id),
          processing,
        });
      });
    },

    async getAipDetail(aipId) {
      const client = await supabaseServer();
      const { data, error } = await client
        .from("aips")
        .select(
          "id,fiscal_year,status,created_at,published_at,barangay_id,city_id,municipality_id,barangay:barangays!aips_barangay_id_fkey(name),city:cities!aips_city_id_fkey(name),municipality:municipalities!aips_municipality_id_fkey(name)"
        )
        .eq("id", aipId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return null;

      const aip = data as AipSelectRow;
      const [filesByAip, projectsByAip, summariesByAip, revisionNotes] = await Promise.all([
        getCurrentFiles([aipId]),
        getProjectsByAipIds([aipId]),
        getLatestSummaries([aipId]),
        getLatestRevisionNotes([aipId]),
      ]);

      const file = filesByAip.get(aipId);
      const profilesById = await getProfilesByIds(file ? [file.uploaded_by] : []);
      const pdfUrl = await createSignedUrl(file);

      return buildAipHeader({
        aip,
        currentFile: file,
        projects: projectsByAip.get(aipId) ?? [],
        summary: parseSummary(summariesByAip.get(aipId)),
        uploader: file ? profilesById.get(file.uploaded_by) : undefined,
        pdfUrl,
        revisionNote: revisionNotes.get(aipId),
      });
    },

    async updateAipStatus(aipId, next) {
      const client = await supabaseServer();
      const { error } = await client.from("aips").update({ status: next }).eq("id", aipId);
      if (error) throw new Error(error.message);
    },
  };
}

export function createSupabaseAipProjectRepo(): AipProjectRepo {
  return {
    async listByAip(aipId) {
      const client = await supabaseServer();
      const { data: projects, error } = await client
        .from("projects")
        .select("id,aip_id,aip_ref_code,program_project_description,total,category,sector_code,errors")
        .eq("aip_id", aipId)
        .order("aip_ref_code", { ascending: true });

      if (error) throw new Error(error.message);
      const rows = (projects ?? []) as ProjectSelectRow[];
      const projectIds = rows.map((p) => p.id);

      const commentsByProject = new Map<string, string>();
      if (projectIds.length) {
        const { data: notes, error: notesError } = await client
          .from("feedback")
          .select("id,project_id,body,created_at")
          .eq("target_type", "project")
          .eq("kind", "lgu_note")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false });
        if (notesError) throw new Error(notesError.message);
        for (const n of (notes ?? []) as Array<{ project_id: string | null; body: string; created_at: string }>) {
          if (n.project_id && !commentsByProject.has(n.project_id)) commentsByProject.set(n.project_id, n.body);
        }
      }

      return rows.map((row) => {
        const aiIssues =
          Array.isArray(row.errors) && row.errors.every((v) => typeof v === "string")
            ? (row.errors as string[])
            : undefined;
        const officialComment = commentsByProject.get(row.id);
        const reviewStatus = officialComment
          ? "reviewed"
          : aiIssues && aiIssues.length
          ? "ai_flagged"
          : "unreviewed";

        return {
          id: row.id,
          aipId: row.aip_id,
          projectRefCode: row.aip_ref_code,
          kind: row.category === "health" ? "health" : "infrastructure",
          sector: toSectorLabel(row.sector_code),
          amount: row.total ?? 0,
          reviewStatus,
          aipDescription: row.program_project_description,
          aiIssues,
          officialComment,
        };
      });
    },

    async submitReview(input) {
      const client = await supabaseServer();
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError || !authData.user?.id) throw new Error("Unauthorized");

      const { error } = await client.from("feedback").insert({
        target_type: "project",
        aip_id: null,
        project_id: input.projectId,
        parent_feedback_id: null,
        source: "human",
        kind: "lgu_note",
        extraction_run_id: null,
        extraction_artifact_id: null,
        field_key: input.resolution ?? null,
        severity: null,
        body: input.comment,
        is_public: true,
        author_id: authData.user.id,
      });

      if (error) throw new Error(error.message);
    },
  };
}
