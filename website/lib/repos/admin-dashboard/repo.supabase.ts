import { supabaseBrowser } from "@/lib/supabase/client";
import type { AdminDashboardRepo } from "./types";
import {
  deriveAipStatusDistribution,
  deriveRecentActivity,
  deriveReviewBacklog,
  deriveSummary,
  deriveUsageMetrics,
  listLguOptions,
} from "./mappers/admin-dashboard.mapper";
import type { AdminDashboardDataset } from "./types";

async function loadDataset(): Promise<AdminDashboardDataset> {
  const client = supabaseBrowser();
  const [
    citiesResult,
    municipalitiesResult,
    barangaysResult,
    profilesResult,
    aipsResult,
    feedbackResult,
    activityResult,
    chatMessagesResult,
  ] = await Promise.all([
    client
      .from("cities")
      .select("id,region_id,province_id,psgc_code,name,is_independent,is_active,created_at"),
    client
      .from("municipalities")
      .select("id,province_id,psgc_code,name,is_active,created_at"),
    client
      .from("barangays")
      .select("id,city_id,municipality_id,psgc_code,name,is_active,created_at"),
    client
      .from("profiles")
      .select("id,role,full_name,email,barangay_id,city_id,municipality_id,is_active,created_at,updated_at"),
    client
      .from("aips")
      .select(
        "id,fiscal_year,barangay_id,city_id,municipality_id,status,status_updated_at,submitted_at,published_at,created_by,created_at,updated_at"
      ),
    client
      .from("feedback")
      .select(
        "id,target_type,aip_id,project_id,parent_feedback_id,source,kind,extraction_run_id,extraction_artifact_id,field_key,severity,body,is_public,author_id,created_at,updated_at"
      ),
    client
      .from("activity_log")
      .select(
        "id,actor_id,actor_role,action,entity_table,entity_id,region_id,province_id,city_id,municipality_id,barangay_id,metadata,created_at"
      ),
    client
      .from("chat_messages")
      .select("id,session_id,role,content,citations,retrieval_meta,created_at"),
  ]);

  const results = [
    citiesResult,
    municipalitiesResult,
    barangaysResult,
    profilesResult,
    aipsResult,
    feedbackResult,
    activityResult,
    chatMessagesResult,
  ];
  const firstError = results.find((result) => result.error)?.error;
  if (firstError) {
    throw new Error(firstError.message);
  }

  return {
    cities: (citiesResult.data ?? []) as AdminDashboardDataset["cities"],
    municipalities:
      (municipalitiesResult.data ?? []) as AdminDashboardDataset["municipalities"],
    barangays: (barangaysResult.data ?? []) as AdminDashboardDataset["barangays"],
    profiles: (profilesResult.data ?? []) as AdminDashboardDataset["profiles"],
    aips: (aipsResult.data ?? []) as AdminDashboardDataset["aips"],
    feedback: (feedbackResult.data ?? []) as AdminDashboardDataset["feedback"],
    activity: (activityResult.data ?? []) as AdminDashboardDataset["activity"],
    chatMessages:
      (chatMessagesResult.data ?? []) as AdminDashboardDataset["chatMessages"],
  };
}

export function createSupabaseAdminDashboardRepo(): AdminDashboardRepo {
  return {
    async getSummary(filters) {
      return deriveSummary(await loadDataset(), filters);
    },
    async getAipStatusDistribution(filters) {
      return deriveAipStatusDistribution(await loadDataset(), filters);
    },
    async getReviewBacklog(filters) {
      return deriveReviewBacklog(await loadDataset(), filters);
    },
    async getUsageMetrics(filters) {
      return deriveUsageMetrics(await loadDataset(), filters);
    },
    async getRecentActivity(filters) {
      return deriveRecentActivity(await loadDataset(), filters);
    },
    async listLguOptions() {
      return listLguOptions(await loadDataset());
    },
  };
}

