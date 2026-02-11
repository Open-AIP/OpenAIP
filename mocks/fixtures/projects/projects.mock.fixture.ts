import { HEALTH_DETAILS_TABLE } from "@/mocks/fixtures/projects/health-details-table.fixture";
import { INFRA_DETAILS_TABLE } from "@/mocks/fixtures/projects/infrastructure-details-table.fixture";
import { PROJECTS_TABLE } from "@/mocks/fixtures/projects/projects-table.fixture";

export type ProjectRowDTO = {
  id: string;
  aip_id: string | null;
  aip_ref_code: string | null;
  program_project_description: string | null;
  implementing_agency: string | null;
  start_date: string | null;
  completion_date: string | null;
  expected_output: string | null;
  source_of_funds: string | null;
  personal_services: number | null;
  maintenance_and_other_operating_expenses: number | null;
  capital_outlay: number | null;
  total: number | null;
  climate_change_adaptation: boolean | null;
  climate_change_mitigation: boolean | null;
  climate_change_adaptation_amount: number | null;
  climate_change_mitigation_amount: number | null;
  errors: string[] | null;
  category: string | null;
  sector_code: string | null;
  is_human_edited: boolean | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  status?: string | null;
  image_url?: string | null;
};

export type HealthProjectDetailsRowDTO = {
  project_id: string;
  program_name: string | null;
  description: string | null;
  target_participants: string | null;
  total_target_participants: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type InfrastructureProjectDetailsRowDTO = {
  project_id: string;
  project_name: string | null;
  contractor_name: string | null;
  contract_cost: number | null;
  start_date: string | null;
  target_completion_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

const now = new Date().toISOString();

const healthByRef = new Map(
  HEALTH_DETAILS_TABLE.map((detail) => [detail.projectRefCode, detail])
);
const infraByRef = new Map(
  INFRA_DETAILS_TABLE.map((detail) => [detail.projectRefCode, detail])
);

export const MOCK_PROJECTS_ROWS: ProjectRowDTO[] = [
  ...PROJECTS_TABLE.map((project) => {
    const health = healthByRef.get(project.projectRefCode) ?? null;
    const infra = infraByRef.get(project.projectRefCode) ?? null;
    const startDate =
      project.kind === "infrastructure" && infra
        ? infra.startDate
        : `${project.year}-01-01`;
    const completionDate =
      project.kind === "infrastructure" && infra ? infra.targetCompletionDate : null;
    const implementingAgency =
      project.kind === "health"
        ? health?.implementingOffice ?? null
        : infra?.implementingOffice ?? null;
    const sourceOfFunds =
      project.kind === "infrastructure" ? infra?.fundingSource ?? null : null;
    const totalBudget =
      project.kind === "health"
        ? health?.budgetAllocated ?? null
        : infra?.contractCost ?? null;

    const expectedOutput = (() => {
      if (project.kind === "health") {
        return `Program overview: ${project.title}. This initiative is designed to improve community health outcomes through targeted services and outreach.`;
      }
      if (project.kind === "infrastructure") {
        return `Project overview: ${project.title}. This project focuses on improving public infrastructure to enhance safety, access, and community services.`;
      }
      return `Overview: ${project.title}.`;
    })();

    return {
      id: project.projectRefCode,
      aip_id: null,
      aip_ref_code: project.projectRefCode,
      program_project_description: project.title,
      implementing_agency: implementingAgency,
      start_date: startDate,
      completion_date: completionDate,
      expected_output: expectedOutput,
      source_of_funds: sourceOfFunds,
      personal_services: null,
      maintenance_and_other_operating_expenses: null,
      capital_outlay: null,
      total: totalBudget,
      climate_change_adaptation: null,
      climate_change_mitigation: null,
      climate_change_adaptation_amount: null,
      climate_change_mitigation_amount: null,
      errors: null,
      category: project.kind,
      sector_code: null,
      is_human_edited: null,
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null,
      status: project.status,
      image_url: project.imageUrl ?? null,
    };
  }),
  {
    id: "PROJ-O-2026-001",
    aip_id: null,
    aip_ref_code: "PROJ-O-2026-001",
    program_project_description: "Other Community Initiative",
    implementing_agency: null,
    start_date: "2026-01-01",
    completion_date: null,
    expected_output: null,
    source_of_funds: null,
    personal_services: null,
    maintenance_and_other_operating_expenses: null,
    capital_outlay: null,
    total: 0,
    climate_change_adaptation: null,
    climate_change_mitigation: null,
    climate_change_adaptation_amount: null,
    climate_change_mitigation_amount: null,
    errors: null,
    category: "other",
    sector_code: null,
    is_human_edited: null,
    created_at: now,
    updated_at: now,
    created_by: null,
    updated_by: null,
    status: "planning",
    image_url: null,
  },
];

export const MOCK_HEALTH_DETAILS_ROWS: HealthProjectDetailsRowDTO[] =
  HEALTH_DETAILS_TABLE.map((detail) => ({
    project_id: detail.projectRefCode,
    program_name: detail.month,
    description: `Detailed description for ${detail.projectRefCode}: This program outlines key activities, target coverage, and expected health benefits for the community.`,
    target_participants: detail.targetParticipants,
    total_target_participants: detail.totalTargetParticipants,
    created_at: now,
    updated_at: now,
    created_by: null,
    updated_by: null,
  }));

export const MOCK_INFRA_DETAILS_ROWS: InfrastructureProjectDetailsRowDTO[] =
  INFRA_DETAILS_TABLE.map((detail) => ({
    project_id: detail.projectRefCode,
    project_name: detail.projectRefCode,
    contractor_name: detail.contractorName,
    contract_cost: detail.contractCost,
    start_date: detail.startDate,
    target_completion_date: detail.targetCompletionDate,
    created_at: now,
    updated_at: now,
    created_by: null,
    updated_by: null,
  }));
