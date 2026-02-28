import type { FeedbackModerationProjectUpdatesRepo } from "./repo";
import {
  PROJECT_UPDATE_ACTIONS,
  PROJECT_UPDATE_LGU_MAP,
  PROJECT_UPDATE_LOGS,
} from "@/mocks/fixtures/admin/feedback-moderation/projectUpdatesMedia.mock";

export function createMockFeedbackModerationProjectUpdatesRepo(): FeedbackModerationProjectUpdatesRepo {
  let actions = [...PROJECT_UPDATE_ACTIONS];

  const buildSeed = () => ({
    updates: PROJECT_UPDATE_LOGS,
    actions,
    lguMap: {
      projects: PROJECT_UPDATE_LGU_MAP.projects,
      aips: PROJECT_UPDATE_LGU_MAP.aips,
      profiles: PROJECT_UPDATE_LGU_MAP.profiles,
      cities: PROJECT_UPDATE_LGU_MAP.cities,
      barangays: PROJECT_UPDATE_LGU_MAP.barangays,
      municipalities: PROJECT_UPDATE_LGU_MAP.municipalities,
    },
  });

  const appendAction = (
    input: { updateId: string; reason: string; violationCategory?: string | null },
    action: "project_update_flagged" | "project_update_removed"
  ) => {
    actions = [
      ...actions,
      {
        id: `mock_update_action_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        actor_id: "admin_001",
        actor_role: "admin",
        action,
        entity_table: "activity_log",
        entity_id: input.updateId,
        region_id: null,
        province_id: null,
        city_id: null,
        municipality_id: null,
        barangay_id: null,
        metadata: {
          reason: input.reason,
          violation_category: input.violationCategory ?? null,
        },
        created_at: new Date().toISOString(),
      },
    ];
  };

  return {
    async getSeedData() {
      return buildSeed();
    },
    async flagUpdate(input) {
      appendAction(input, "project_update_flagged");
      return buildSeed();
    },
    async removeUpdate(input) {
      appendAction(input, "project_update_removed");
      return buildSeed();
    },
  };
}
