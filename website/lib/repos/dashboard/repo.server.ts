import "server-only";

import { selectRepo } from "@/lib/repos/_shared/selector";
import type { DashboardRepo } from "./repo";
import { createMockDashboardRepo } from "./repo.mock";
import { createSupabaseDashboardRepo } from "./repo.supabase";

export function getDashboardRepo(): DashboardRepo {
  return selectRepo({
    label: "DashboardRepo",
    mock: () => createMockDashboardRepo(),
    supabase: () => createSupabaseDashboardRepo(),
  });
}
