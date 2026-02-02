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
