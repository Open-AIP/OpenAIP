import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockFeedbackModerationRepo } from "./repo.mock";

export type {
  Dbv2ActivityLogRow,
  Dbv2AipRow,
  Dbv2BarangayRow,
  Dbv2CityRow,
  Dbv2FeedbackRow,
  Dbv2MunicipalityRow,
  Dbv2ProfileRow,
  Dbv2ProjectRow,
  FeedbackModerationActionInput,
  FeedbackModerationDataset,
  FeedbackModerationRepo,
} from "./types";

import type { FeedbackModerationRepo } from "./types";

// [DATAFLOW] Admin moderation UI depends on this interface; swap adapters without touching UI.
// [DBV2] Canonical sources: public.feedback + public.activity_log.
export function getFeedbackModerationRepo(): FeedbackModerationRepo {
  return selectRepo({
    label: "FeedbackModerationRepo",
    mock: () => createMockFeedbackModerationRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "FeedbackModerationRepo is mock-only for now. Add server implementation when wiring Supabase."
      );
    },
  });
}

