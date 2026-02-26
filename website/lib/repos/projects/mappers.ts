import type { HealthProject, InfrastructureProject, OtherProject, UiProject } from "./types";
import type {
  HealthProjectDetailsRow,
  InfrastructureProjectDetailsRow,
  ProjectRow,
} from "./db.types";
import type { ProjectStatus } from "./types";

export function inferKind(
  projectRow: ProjectRow
): "health" | "infrastructure" | "other" {
  const category = projectRow.category.toLowerCase();
  if (category === "health") return "health";
  if (category === "infrastructure") return "infrastructure";
  return "other";
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const HEALTH_MONTH_LOOKUP: Record<string, (typeof MONTH_NAMES)[number]> = {
  january: "January",
  jan: "January",
  february: "February",
  feb: "February",
  march: "March",
  mar: "March",
  april: "April",
  apr: "April",
  may: "May",
  june: "June",
  jun: "June",
  july: "July",
  jul: "July",
  august: "August",
  aug: "August",
  september: "September",
  sep: "September",
  sept: "September",
  october: "October",
  oct: "October",
  november: "November",
  nov: "November",
  december: "December",
  dec: "December",
};

function parseProjectDateInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function extractHealthMonthFromProgramName(
  value: string | null | undefined
): (typeof MONTH_NAMES)[number] | null {
  if (!value) return null;
  const tokens = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  for (const token of tokens) {
    const month = HEALTH_MONTH_LOOKUP[token];
    if (month) return month;
  }

  return null;
}

function deriveHealthMonth(
  projectRow: ProjectRow,
  healthDetails?: HealthProjectDetailsRow | null
): string {
  const monthFromProgramName = extractHealthMonthFromProgramName(
    healthDetails?.program_name
  );
  if (monthFromProgramName) return monthFromProgramName;

  const startDate = parseProjectDateInput(projectRow.start_date);
  if (startDate) return MONTH_NAMES[startDate.getUTCMonth()] ?? "";

  const completionDate = parseProjectDateInput(projectRow.completion_date);
  if (completionDate) return MONTH_NAMES[completionDate.getUTCMonth()] ?? "";

  return "";
}

function getYearFromDates(projectRow: ProjectRow): number {
  const startDate = parseProjectDateInput(projectRow.start_date);
  if (startDate) return startDate.getUTCFullYear();

  const completionDate = parseProjectDateInput(projectRow.completion_date);
  if (completionDate) return completionDate.getUTCFullYear();

  return new Date().getFullYear();
}

export type ProjectUiMeta = {
  status?: ProjectStatus | null;
  imageUrl?: string | null;
  year?: number | null;
};

function resolveProjectYear(
  projectRow: ProjectRow,
  meta?: ProjectUiMeta
): number {
  const explicitYear = meta?.year;
  if (typeof explicitYear === "number" && Number.isFinite(explicitYear)) {
    return Math.trunc(explicitYear);
  }
  return getYearFromDates(projectRow);
}

export function mapProjectRowToUiModel(
  projectRow: ProjectRow,
  healthDetails?: HealthProjectDetailsRow | null,
  infraDetails?: InfrastructureProjectDetailsRow | null,
  meta?: ProjectUiMeta
): UiProject {
  const kind = inferKind(projectRow);
  const projectRefCode = projectRow.aip_ref_code || projectRow.id;
  const title =
    projectRow.program_project_description || projectRow.expected_output || "Untitled Project";
  const description =
    healthDetails?.description || projectRow.expected_output || projectRow.program_project_description || "";
  const year = resolveProjectYear(projectRow, meta);
  const status = (meta?.status ?? "proposed") as HealthProject["status"];
  const imageUrl = meta?.imageUrl ?? undefined;

  if (kind === "health") {
    const month = deriveHealthMonth(projectRow, healthDetails);
    const startDate = projectRow.start_date ?? "";
    const targetCompletionDate = projectRow.completion_date ?? "";
    const totalTargetParticipants = healthDetails?.total_target_participants ?? 0;
    const targetParticipants = healthDetails?.target_participants ?? "";
    const implementingOffice = projectRow.implementing_agency ?? "";
    const budgetAllocated = projectRow.total ?? 0;

    const project: HealthProject = {
      id: projectRefCode,
      kind: "health",
      year,
      title,
      status,
      imageUrl,
      month,
      startDate,
      targetCompletionDate,
      description,
      totalTargetParticipants,
      targetParticipants,
      implementingOffice,
      budgetAllocated,
      updates: [],
    };

    return project;
  }

  if (kind === "infrastructure") {
    const startDate = infraDetails?.start_date ?? projectRow.start_date ?? "";
    const targetCompletionDate =
      infraDetails?.target_completion_date ?? projectRow.completion_date ?? "";
    const implementingOffice = projectRow.implementing_agency ?? "";
    const fundingSource = projectRow.source_of_funds ?? "";
    const contractorName = infraDetails?.contractor_name ?? "";
    const contractCost = infraDetails?.contract_cost ?? 0;

    const project: InfrastructureProject = {
      id: projectRefCode,
      kind: "infrastructure",
      year,
      title,
      status,
      imageUrl,
      description,
      startDate,
      targetCompletionDate,
      implementingOffice,
      fundingSource,
      contractorName,
      contractCost,
      updates: [],
    };

    return project;
  }

  const project: OtherProject = {
    id: projectRefCode,
    kind: "other",
    projectRefCode,
    year,
    title,
    status,
    imageUrl,
    updates: [],
  };

  return project;
}
