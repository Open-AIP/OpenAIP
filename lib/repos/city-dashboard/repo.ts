import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockCityDashboardRepo } from "./repo.mock";

export type {
  CityDashboardRepo,
  CityDashboardFilters,
  CityDashboardData,
  CityAipSummary,
  ReviewQueueMetrics,
  EngagementPulse,
  RecentComment,
} from "./types";

import type { CityDashboardRepo } from "./types";

export function getCityDashboardRepo(): CityDashboardRepo {
  return selectRepo({
    label: "CityDashboardRepo",
    mock: () => createMockCityDashboardRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "CityDashboardRepo is mock-only for now. Add server implementation when wiring Supabase."
      );
    },
  });
}
