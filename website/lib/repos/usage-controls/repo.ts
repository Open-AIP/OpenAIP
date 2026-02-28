import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockUsageControlsRepo } from "./repo.mock";
import { createSupabaseUsageControlsRepo } from "./repo.supabase";

export type {
  AuditEntryVM,
  FlaggedUserRowVM,
  RateLimitSettingsVM,
  UsageControlsRepo,
} from "./types";

import type { UsageControlsRepo } from "./types";

export function getUsageControlsRepo(): UsageControlsRepo {
  return selectRepo({
    label: "UsageControlsRepo",
    mock: () => createMockUsageControlsRepo(),
    supabase: () => createSupabaseUsageControlsRepo(),
  });
}
