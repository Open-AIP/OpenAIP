import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockSystemAdministrationRepo } from "./repo.mock";

export type {
  SystemAdministrationRepo,
  SecuritySettings,
  NotificationSettings,
  SystemBannerDraft,
  SystemBanner,
  SystemAdministrationAuditLog,
} from "./types";

import type { SystemAdministrationRepo } from "./types";

export function getSystemAdministrationRepo(): SystemAdministrationRepo {
  return selectRepo({
    label: "SystemAdministrationRepo",
    mock: () => createMockSystemAdministrationRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "SystemAdministrationRepo is mock-only for now. Add server implementation when wiring Supabase."
      );
    },
  });
}

