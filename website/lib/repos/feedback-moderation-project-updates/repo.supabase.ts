import { supabaseBrowser } from "@/lib/supabase/client";
import type {
  FeedbackModerationProjectUpdatesRepo,
  FeedbackModerationProjectUpdatesSeed,
  ProjectUpdateModerationInput,
} from "./repo";

async function loadSeedData(): Promise<FeedbackModerationProjectUpdatesSeed> {
  const client = supabaseBrowser();
  const [
    updatesResult,
    actionsResult,
    projectsResult,
    aipsResult,
    profilesResult,
    citiesResult,
    barangaysResult,
    municipalitiesResult,
  ] = await Promise.all([
    client
      .from("activity_log")
      .select(
        "id,actor_id,actor_role,action,entity_table,entity_id,region_id,province_id,city_id,municipality_id,barangay_id,metadata,created_at"
      )
      .eq("action", "project_updated")
      .eq("entity_table", "projects")
      .order("created_at", { ascending: false }),
    client
      .from("activity_log")
      .select(
        "id,actor_id,actor_role,action,entity_table,entity_id,region_id,province_id,city_id,municipality_id,barangay_id,metadata,created_at"
      )
      .in("action", ["project_update_flagged", "project_update_removed"])
      .eq("entity_table", "activity_log")
      .order("created_at", { ascending: false }),
    client
      .from("projects")
      .select(
        "id,aip_id,extraction_artifact_id,aip_ref_code,program_project_description,implementing_agency,start_date,completion_date,expected_output,source_of_funds,personal_services,maintenance_and_other_operating_expenses,financial_expenses,capital_outlay,total,climate_change_adaptation,climate_change_mitigation,cc_topology_code,prm_ncr_lgu_rm_objective_results_indicator,errors,category,sector_code,is_human_edited,edited_by,edited_at,created_at,updated_at"
      ),
    client
      .from("aips")
      .select(
        "id,fiscal_year,barangay_id,city_id,municipality_id,status,status_updated_at,submitted_at,published_at,created_by,created_at,updated_at"
      ),
    client
      .from("profiles")
      .select("id,role,full_name,email,barangay_id,city_id,municipality_id,is_active,created_at,updated_at"),
    client
      .from("cities")
      .select("id,region_id,province_id,psgc_code,name,is_independent,is_active,created_at"),
    client
      .from("barangays")
      .select("id,city_id,municipality_id,psgc_code,name,is_active,created_at"),
    client
      .from("municipalities")
      .select("id,province_id,psgc_code,name,is_active,created_at"),
  ]);

  const firstError = [
    updatesResult,
    actionsResult,
    projectsResult,
    aipsResult,
    profilesResult,
    citiesResult,
    barangaysResult,
    municipalitiesResult,
  ].find((result) => result.error)?.error;
  if (firstError) {
    throw new Error(firstError.message);
  }

  return {
    updates: (updatesResult.data ?? []) as FeedbackModerationProjectUpdatesSeed["updates"],
    actions: (actionsResult.data ?? []) as FeedbackModerationProjectUpdatesSeed["actions"],
    lguMap: {
      projects:
        (projectsResult.data ?? []) as FeedbackModerationProjectUpdatesSeed["lguMap"]["projects"],
      aips: (aipsResult.data ?? []) as FeedbackModerationProjectUpdatesSeed["lguMap"]["aips"],
      profiles:
        (profilesResult.data ?? []) as FeedbackModerationProjectUpdatesSeed["lguMap"]["profiles"],
      cities:
        (citiesResult.data ?? []) as FeedbackModerationProjectUpdatesSeed["lguMap"]["cities"],
      barangays:
        (barangaysResult.data ?? []) as FeedbackModerationProjectUpdatesSeed["lguMap"]["barangays"],
      municipalities:
        (municipalitiesResult.data ??
          []) as FeedbackModerationProjectUpdatesSeed["lguMap"]["municipalities"],
    },
  };
}

async function logProjectUpdateAction(
  input: ProjectUpdateModerationInput,
  action: "project_update_flagged" | "project_update_removed"
): Promise<void> {
  const client = supabaseBrowser();
  const { error } = await client.rpc("log_activity", {
    p_action: action,
    p_entity_table: "activity_log",
    p_entity_id: input.updateId,
    p_region_id: input.scope?.region_id ?? null,
    p_province_id: input.scope?.province_id ?? null,
    p_city_id: input.scope?.city_id ?? null,
    p_municipality_id: input.scope?.municipality_id ?? null,
    p_barangay_id: input.scope?.barangay_id ?? null,
    p_metadata: {
      reason: input.reason,
      violation_category: input.violationCategory ?? null,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function createSupabaseFeedbackModerationProjectUpdatesRepo(): FeedbackModerationProjectUpdatesRepo {
  return {
    async getSeedData() {
      return loadSeedData();
    },
    async flagUpdate(input) {
      await logProjectUpdateAction(input, "project_update_flagged");
      return loadSeedData();
    },
    async removeUpdate(input) {
      await logProjectUpdateAction(input, "project_update_removed");
      return loadSeedData();
    },
  };
}
