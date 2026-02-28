import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockAdminDashboardRepo } from "./repo.mock";
import { createSupabaseAdminDashboardRepo } from "./repo.supabase";

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
    supabase: () => createSupabaseAdminDashboardRepo(),
  });
}

