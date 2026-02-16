import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockBarangayDashboardRepo } from "./repo.mock";

export type {
  BarangayDashboardRepo,
  BarangayDashboardFilters,
  BarangayDashboardData,
  BarangayProjectSector,
  TopFundedProjectRow,
  RecentProjectUpdate,
  ActivityFeedItem,
} from "./types";

import type { BarangayDashboardRepo } from "./types";

export function getBarangayDashboardRepo(): BarangayDashboardRepo {
  return selectRepo({
    label: "BarangayDashboardRepo",
    mock: () => createMockBarangayDashboardRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "BarangayDashboardRepo is mock-only for now. Add server implementation when wiring Supabase."
      );
    },
  });
}
