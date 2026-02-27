import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockDashboardRepo } from "./repo.mock";
import type {
  CreateDashboardDraftInput,
  CreateDashboardDraftResult,
  DashboardData,
  DashboardDataByScopeInput,
  ReplyDashboardFeedbackInput,
  ReplyDashboardFeedbackResult,
} from "./types";

export type {
  DashboardScope,
  DashboardAip,
  DashboardProject,
  DashboardSector,
  DashboardRun,
  DashboardReview,
  DashboardFeedback,
  DashboardData,
  DashboardQueryState,
  DashboardViewModel,
  DashboardDataByScopeInput,
  CreateDashboardDraftInput,
  CreateDashboardDraftResult,
  ReplyDashboardFeedbackInput,
  ReplyDashboardFeedbackResult,
} from "./types";

export { CITIZEN_FEEDBACK_KINDS, DASHBOARD_REPLY_MAX_LENGTH } from "./types";

export interface DashboardRepo {
  getDashboardDataByScope(input: DashboardDataByScopeInput): Promise<DashboardData>;
  createDraftAip(input: CreateDashboardDraftInput): Promise<CreateDashboardDraftResult>;
  replyToFeedback(input: ReplyDashboardFeedbackInput): Promise<ReplyDashboardFeedbackResult>;
}

export function getDashboardRepo(): DashboardRepo {
  return selectRepo({
    label: "DashboardRepo",
    mock: () => createMockDashboardRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "DashboardRepo is server-only outside mock mode. Import from `@/lib/repos/dashboard/repo.server`."
      );
    },
  });
}
