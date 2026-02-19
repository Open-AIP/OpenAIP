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

function getYearFromDates(projectRow: ProjectRow): number {
  const dateValue = projectRow.start_date ?? projectRow.completion_date;
  if (!dateValue) return new Date().getFullYear();
  const year = new Date(dateValue).getFullYear();
  return Number.isNaN(year) ? new Date().getFullYear() : year;
}

export type ProjectUiMeta = {
  status?: ProjectStatus | null;
  imageUrl?: string | null;
};

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
  const year = getYearFromDates(projectRow);
  const status = (meta?.status ?? "planning") as HealthProject["status"];
  const imageUrl = meta?.imageUrl ?? undefined;

  if (kind === "health") {
    const month = healthDetails?.program_name ?? "Unknown";
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
