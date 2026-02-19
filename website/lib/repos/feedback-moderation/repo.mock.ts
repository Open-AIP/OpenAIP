import { FEEDBACK_MODERATION_DATASET } from "@/mocks/fixtures/admin/feedback-moderation/feedbackModeration.mock";
import type {
  Dbv2ActivityLogRow,
  Dbv2FeedbackRow,
  FeedbackModerationActionInput,
  FeedbackModerationDataset,
  FeedbackModerationRepo,
} from "./types";

let idCounter = 0;

const nowIso = () => new Date().toISOString();

const createId = (prefix: string) => {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}`;
};

const cloneDataset = (dataset: FeedbackModerationDataset): FeedbackModerationDataset => ({
  feedback: dataset.feedback.map((row) => ({ ...row })),
  activity: dataset.activity.map((row) => ({ ...row })),
  profiles: dataset.profiles.map((row) => ({ ...row })),
  aips: dataset.aips.map((row) => ({ ...row })),
  projects: dataset.projects.map((row) => ({ ...row })),
  cities: dataset.cities.map((row) => ({ ...row })),
  barangays: dataset.barangays.map((row) => ({ ...row })),
  municipalities: dataset.municipalities.map((row) => ({ ...row })),
});

const createStore = () => cloneDataset(FEEDBACK_MODERATION_DATASET);

const store = createStore();

const updateFeedbackVisibility = (feedbackId: string, isPublic: boolean) => {
  store.feedback = store.feedback.map((row) => {
    if (row.id !== feedbackId) return row;
    return {
      ...row,
      is_public: isPublic,
      updated_at: nowIso(),
    } satisfies Dbv2FeedbackRow;
  });
};

const appendAuditLog = (
  input: FeedbackModerationActionInput,
  action: "feedback_hidden" | "feedback_unhidden"
) => {
  const log: Dbv2ActivityLogRow = {
    id: createId("activity"),
    actor_id: input.actorId,
    actor_role: input.actorRole ?? null,
    action,
    entity_table: "feedback",
    entity_id: input.feedbackId,
    region_id: input.scope?.region_id ?? null,
    province_id: input.scope?.province_id ?? null,
    city_id: input.scope?.city_id ?? null,
    municipality_id: input.scope?.municipality_id ?? null,
    barangay_id: input.scope?.barangay_id ?? null,
    metadata: {
      reason: input.reason,
      violation_category: input.violationCategory ?? null,
    },
    created_at: nowIso(),
  };

  store.activity = [...store.activity, log];
};

export function createMockFeedbackModerationRepo(): FeedbackModerationRepo {
  return {
    async listDataset() {
      return cloneDataset(store);
    },
    async hideFeedback(input) {
      updateFeedbackVisibility(input.feedbackId, false);
      appendAuditLog(input, "feedback_hidden");
      return cloneDataset(store);
    },
    async unhideFeedback(input) {
      updateFeedbackVisibility(input.feedbackId, true);
      appendAuditLog(input, "feedback_unhidden");
      return cloneDataset(store);
    },
  };
}
