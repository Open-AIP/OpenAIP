import { PLATFORM_CONTROLS_DATASET } from "@/mocks/fixtures/admin/usage-controls/platformControls.mock";
import { CHAT_MESSAGES_FIXTURE } from "@/mocks/fixtures/chat/chat.fixture";
import type { ActivityLogRow } from "@/lib/contracts/databasev2";
import type { PlatformControlsDataset, UsageControlsRepo } from "./types";
import {
  deriveRateLimitSettings,
  deriveChatbotMetrics,
  deriveChatbotRateLimitPolicy,
  deriveChatbotSystemPolicy,
  mapFlaggedUsers,
  mapUserAuditHistory,
} from "./mappers/usage-controls.mapper";

let idCounter = 0;

const nowIso = () => new Date().toISOString();

const createId = (prefix: string) => {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}`;
};

const cloneDataset = (dataset: PlatformControlsDataset): PlatformControlsDataset => ({
  profiles: dataset.profiles.map((row) => ({ ...row })),
  feedback: dataset.feedback.map((row) => ({ ...row })),
  activity: dataset.activity.map((row) => ({ ...row })),
});

const createStore = () => cloneDataset(PLATFORM_CONTROLS_DATASET);

const store = createStore();

const appendActivity = (input: ActivityLogRow) => {
  store.activity = [...store.activity, input];
};

const deriveBlockedUntil = (durationValue: number, durationUnit: "days" | "weeks") => {
  const days = durationUnit === "weeks" ? durationValue * 7 : durationValue;
  const blockedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return blockedUntil.toISOString().slice(0, 10);
};

export function createMockUsageControlsRepo(): UsageControlsRepo {
  return {
    async getRateLimitSettings() {
      return deriveRateLimitSettings(store.activity);
    },
    async updateRateLimitSettings(input) {
      appendActivity({
        id: createId("activity"),
        actor_id: "admin_001",
        actor_role: "admin",
        action: "comment_rate_limit_updated",
        entity_table: null,
        entity_id: null,
        region_id: null,
        province_id: null,
        city_id: null,
        municipality_id: null,
        barangay_id: null,
        metadata: {
          max_comments: input.maxComments,
          time_window: input.timeWindow,
          actor_name: "Admin Maria Rodriguez",
        },
        created_at: nowIso(),
      });
      return deriveRateLimitSettings(store.activity);
    },
    async listFlaggedUsers() {
      return mapFlaggedUsers(store);
    },
    async getChatbotMetrics() {
      return deriveChatbotMetrics(CHAT_MESSAGES_FIXTURE);
    },
    async getChatbotRateLimitPolicy() {
      return deriveChatbotRateLimitPolicy(store.activity);
    },
    async updateChatbotRateLimitPolicy(input) {
      appendActivity({
        id: createId("activity"),
        actor_id: "admin_001",
        actor_role: "admin",
        action: "chatbot_rate_limit_updated",
        entity_table: null,
        entity_id: null,
        region_id: null,
        province_id: null,
        city_id: null,
        municipality_id: null,
        barangay_id: null,
        metadata: {
          max_requests: input.maxRequests,
          time_window: input.timeWindow,
          actor_name: "Admin Maria Rodriguez",
        },
        created_at: nowIso(),
      });
      return deriveChatbotRateLimitPolicy(store.activity);
    },
    async getChatbotSystemPolicy() {
      return deriveChatbotSystemPolicy(store.activity);
    },
    async updateChatbotSystemPolicy(input) {
      appendActivity({
        id: createId("activity"),
        actor_id: "admin_001",
        actor_role: "admin",
        action: "chatbot_policy_updated",
        entity_table: null,
        entity_id: null,
        region_id: null,
        province_id: null,
        city_id: null,
        municipality_id: null,
        barangay_id: null,
        metadata: {
          is_enabled: input.isEnabled,
          retention_days: input.retentionDays,
          user_disclaimer: input.userDisclaimer,
          actor_name: "Admin Maria Rodriguez",
        },
        created_at: nowIso(),
      });
      return deriveChatbotSystemPolicy(store.activity);
    },
    async getUserAuditHistory(userId) {
      return mapUserAuditHistory({ userId, feedback: store.feedback, activity: store.activity });
    },
    async temporarilyBlockUser(input) {
      appendActivity({
        id: createId("activity"),
        actor_id: "admin_001",
        actor_role: "admin",
        action: "user_blocked",
        entity_table: "profiles",
        entity_id: input.userId,
        region_id: null,
        province_id: null,
        city_id: null,
        municipality_id: null,
        barangay_id: null,
        metadata: {
          reason: input.reason,
          blocked_until: deriveBlockedUntil(input.durationValue, input.durationUnit),
          actor_name: "Admin Maria Rodriguez",
        },
        created_at: nowIso(),
      });
    },
    async unblockUser(input) {
      appendActivity({
        id: createId("activity"),
        actor_id: "admin_001",
        actor_role: "admin",
        action: "user_unblocked",
        entity_table: "profiles",
        entity_id: input.userId,
        region_id: null,
        province_id: null,
        city_id: null,
        municipality_id: null,
        barangay_id: null,
        metadata: {
          reason: input.reason,
          actor_name: "Admin Maria Rodriguez",
        },
        created_at: nowIso(),
      });
    },
  };
}
