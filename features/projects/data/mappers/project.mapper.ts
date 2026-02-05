import type {
  HealthProject,
  InfrastructureProject,
  ProjectBundle,
} from "../../types";
import type {
  HealthProjectDetailsRowDTO,
  InfrastructureProjectDetailsRowDTO,
  ProjectRowDTO,
} from "../dtos/project.dto";
import type { OtherProject, UiProject } from "../types";

export function inferKind(
  projectRow: ProjectRowDTO
): "health" | "infrastructure" | "other" {
  const category = projectRow.category?.toLowerCase();
  if (category === "health") return "health";
  if (category === "infrastructure") return "infrastructure";
  return "other";
}

function getYearFromDates(projectRow: ProjectRowDTO): number {
  const dateValue = projectRow.start_date ?? projectRow.completion_date;
  if (!dateValue) return new Date().getFullYear();
  const year = new Date(dateValue).getFullYear();
  return Number.isNaN(year) ? new Date().getFullYear() : year;
}

export function mapProjectRowToUiModel(
  projectRow: ProjectRowDTO,
  healthDetails?: HealthProjectDetailsRowDTO | null,
  infraDetails?: InfrastructureProjectDetailsRowDTO | null
): UiProject {
  const kind = inferKind(projectRow);
  const projectRefCode = projectRow.aip_ref_code ?? projectRow.id;
  const title =
    projectRow.program_project_description ?? projectRow.expected_output ?? "Untitled Project";
  const year = getYearFromDates(projectRow);
  const status = (projectRow.status as HealthProject["status"]) ?? "planning";
  const imageUrl = projectRow.image_url ?? undefined;

  if (kind === "health") {
    const month = healthDetails?.program_name ?? "Unknown";
    const totalTargetParticipants = healthDetails?.total_target_participants ?? 0;
    const targetParticipants = healthDetails?.target_participants ?? "";
    const implementingOffice = projectRow.implementing_agency ?? "";
    const budgetAllocated = projectRow.total ?? 0;

    const project: HealthProject = {
      id: projectRefCode,
      kind: "health",
      projectRefCode,
      year,
      title,
      status,
      imageUrl,
      month,
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
      projectRefCode,
      year,
      title,
      status,
      imageUrl,
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
