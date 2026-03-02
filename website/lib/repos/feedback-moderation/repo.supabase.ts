import { getAuthenticatedBrowserClient } from "@/lib/supabase/client";
import type {
  FeedbackModerationActionInput,
  FeedbackModerationDataset,
  FeedbackModerationRepo,
} from "./types";

async function loadDataset(): Promise<FeedbackModerationDataset> {
  const client = await getAuthenticatedBrowserClient();
  const [
    feedbackResult,
    activityResult,
    profilesResult,
    aipsResult,
    projectsResult,
    citiesResult,
    barangaysResult,
    municipalitiesResult,
  ] = await Promise.all([
    client
      .from("feedback")
      .select(
        "id,target_type,aip_id,project_id,parent_feedback_id,source,kind,extraction_run_id,extraction_artifact_id,field_key,severity,body,is_public,author_id,created_at,updated_at"
      ),
    client
      .from("activity_log")
      .select(
        "id,actor_id,actor_role,action,entity_table,entity_id,region_id,province_id,city_id,municipality_id,barangay_id,metadata,created_at"
      )
      .order("created_at", { ascending: false }),
    client
      .from("profiles")
      .select("id,role,full_name,email,barangay_id,city_id,municipality_id,is_active,created_at,updated_at"),
    client
      .from("aips")
      .select(
        "id,fiscal_year,barangay_id,city_id,municipality_id,status,status_updated_at,submitted_at,published_at,created_by,created_at,updated_at"
      ),
    client
      .from("projects")
      .select(
        "id,aip_id,extraction_artifact_id,aip_ref_code,program_project_description,implementing_agency,start_date,completion_date,expected_output,source_of_funds,personal_services,maintenance_and_other_operating_expenses,financial_expenses,capital_outlay,total,climate_change_adaptation,climate_change_mitigation,cc_topology_code,prm_ncr_lgu_rm_objective_results_indicator,errors,category,sector_code,is_human_edited,edited_by,edited_at,created_at,updated_at"
      ),
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
    feedbackResult,
    activityResult,
    profilesResult,
    aipsResult,
    projectsResult,
    citiesResult,
    barangaysResult,
    municipalitiesResult,
  ].find((result) => result.error)?.error;
  if (firstError) {
    throw new Error(firstError.message);
  }

  return {
    feedback: (feedbackResult.data ?? []) as FeedbackModerationDataset["feedback"],
    activity: (activityResult.data ?? []) as FeedbackModerationDataset["activity"],
    profiles: (profilesResult.data ?? []) as FeedbackModerationDataset["profiles"],
    aips: (aipsResult.data ?? []) as FeedbackModerationDataset["aips"],
    projects: (projectsResult.data ?? []) as FeedbackModerationDataset["projects"],
    cities: (citiesResult.data ?? []) as FeedbackModerationDataset["cities"],
    barangays: (barangaysResult.data ?? []) as FeedbackModerationDataset["barangays"],
    municipalities:
      (municipalitiesResult.data ?? []) as FeedbackModerationDataset["municipalities"],
  };
}

async function logModerationActivity(
  input: FeedbackModerationActionInput,
  action: "feedback_hidden" | "feedback_unhidden"
): Promise<void> {
  const client = await getAuthenticatedBrowserClient();
  const { error } = await client.rpc("log_activity", {
    p_action: action,
    p_entity_table: "feedback",
    p_entity_id: input.feedbackId,
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

async function setFeedbackVisibility(
  feedbackId: string,
  isPublic: boolean
): Promise<void> {
  const client = await getAuthenticatedBrowserClient();
  const { error } = await client
    .from("feedback")
    .update({ is_public: isPublic })
    .eq("id", feedbackId);

  if (error) {
    throw new Error(error.message);
  }
}

export function createSupabaseFeedbackModerationRepo(): FeedbackModerationRepo {
  return {
    async listDataset() {
      return loadDataset();
    },
    async hideFeedback(input) {
      await setFeedbackVisibility(input.feedbackId, false);
      await logModerationActivity(input, "feedback_hidden");
      return loadDataset();
    },
    async unhideFeedback(input) {
      await setFeedbackVisibility(input.feedbackId, true);
      await logModerationActivity(input, "feedback_unhidden");
      return loadDataset();
    },
  };
}
