import type { FeedbackModerationProjectUpdatesRepo } from "./repo";
import {
  PROJECT_UPDATE_ACTIONS,
  PROJECT_UPDATE_LGU_MAP,
  PROJECT_UPDATE_LOGS,
} from "@/mocks/fixtures/admin/feedback-moderation/projectUpdatesMedia.mock";

export function createMockFeedbackModerationProjectUpdatesRepo(): FeedbackModerationProjectUpdatesRepo {
  return {
    getSeedData() {
      return {
        updates: PROJECT_UPDATE_LOGS,
        actions: PROJECT_UPDATE_ACTIONS,
        lguMap: {
          projects: PROJECT_UPDATE_LGU_MAP.projects,
          aips: PROJECT_UPDATE_LGU_MAP.aips,
          profiles: PROJECT_UPDATE_LGU_MAP.profiles,
          cities: PROJECT_UPDATE_LGU_MAP.cities,
          barangays: PROJECT_UPDATE_LGU_MAP.barangays,
          municipalities: PROJECT_UPDATE_LGU_MAP.municipalities,
        },
      };
    },
  };
}
