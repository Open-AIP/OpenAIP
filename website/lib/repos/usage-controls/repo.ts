import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockUsageControlsRepo } from "./repo.mock";

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
    supabase: () => {
      throw new NotImplementedError(
        "UsageControlsRepo is mock-only for now. Add server implementation when wiring Supabase."
      );
    },
  });
}
