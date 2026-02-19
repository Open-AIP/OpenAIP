import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockAdminDashboardRepo } from "./repo.mock";

export type {
  AdminDashboardRepo,
  AdminDashboardFilters,
  DashboardSummaryVM,
  AipStatusDistributionVM,
  ReviewBacklogVM,
  UsageMetricsVM,
  RecentActivityItemVM,
  LguOptionVM,
} from "./types";

import type { AdminDashboardRepo } from "./types";

export function getAdminDashboardRepo(): AdminDashboardRepo {
  return selectRepo({
    label: "AdminDashboardRepo",
    mock: () => createMockAdminDashboardRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "AdminDashboardRepo is mock-only for now. Add server implementation when wiring Supabase."
      );
    },
  });
}

