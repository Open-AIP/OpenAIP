import { inferKind, mapProjectRowToUiModel } from "@/lib/repos/projects/mappers";
import type {
  HealthProjectDetailsRow,
  InfrastructureProjectDetailsRow,
  ProjectRow,
} from "@/lib/repos/projects/db.types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runProjectMapperTests() {
  assert(
    inferKind({ category: "health" } as ProjectRow) === "health",
    "inferKind should map health"
  );
  assert(
    inferKind({ category: "infrastructure" } as ProjectRow) === "infrastructure",
    "inferKind should map infrastructure"
  );
  assert(
    inferKind({ category: "other" } as ProjectRow) === "other",
    "inferKind should map other"
  );

  const projectRow = {
    id: "PROJ-H-TEST",
    aip_id: "aip-1",
    extraction_artifact_id: null,
    aip_ref_code: "PROJ-H-TEST",
    program_project_description: "Health Project",
    implementing_agency: "Health Office",
    start_date: "2026-01-01",
    completion_date: null,
    expected_output: "Output",
    source_of_funds: "General Fund",
    personal_services: null,
    maintenance_and_other_operating_expenses: null,
    capital_outlay: null,
    total: 5000,
    climate_change_adaptation: null,
    climate_change_mitigation: null,
    cc_topology_code: null,
    prm_ncr_lgu_rm_objective_results_indicator: null,
    errors: null,
    category: "health",
    sector_code: "PROJ",
    is_human_edited: false,
    edited_by: null,
    edited_at: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  } satisfies ProjectRow;

  const healthDetails = {
    project_id: "PROJ-H-TEST",
    program_name: "January",
    description: null,
    target_participants: "Residents",
    total_target_participants: 100,
    updated_by: null,
    updated_at: "2026-01-01",
    created_at: "2026-01-01",
  } satisfies HealthProjectDetailsRow;

  const mappedHealth = mapProjectRowToUiModel(projectRow, healthDetails, null, {
    status: "ongoing",
    imageUrl: "/mock.png",
  });
  assert(mappedHealth.id === "PROJ-H-TEST", "health id should map");
  assert(mappedHealth.title === "Health Project", "health title should map");
  assert(mappedHealth.year === 2026, "health year should map");
  assert(mappedHealth.kind === "health", "health kind should map");
  assert(mappedHealth.description === "Output", "health description should map");
  assert(mappedHealth.budgetAllocated === 5000, "health budget should map");

  const infraRow = {
    ...projectRow,
    id: "PROJ-I-TEST",
    aip_ref_code: "PROJ-I-TEST",
    program_project_description: "Infra Project",
    category: "infrastructure",
  } satisfies ProjectRow;

  const infraDetails = {
    project_id: "PROJ-I-TEST",
    project_name: "Infra Project",
    contractor_name: "Build Co",
    contract_cost: 9000,
    start_date: "2026-02-01",
    target_completion_date: "2026-05-01",
    updated_by: null,
    updated_at: "2026-01-01",
    created_at: "2026-01-01",
  } satisfies InfrastructureProjectDetailsRow;

  const mappedInfra = mapProjectRowToUiModel(infraRow, null, infraDetails);
  assert(mappedInfra.kind === "infrastructure", "infra kind should map");
  assert(mappedInfra.id === "PROJ-I-TEST", "infra id should map");
  assert(mappedInfra.title === "Infra Project", "infra title should map");
  assert(mappedInfra.description === "Output", "infra description should map");
  assert(mappedInfra.contractCost === 9000, "infra cost should map");
}
