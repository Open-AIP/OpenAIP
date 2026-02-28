import type { UsageControlsRepo } from "./types";

type UsageControlsStateResponse = {
  rateLimitSettings: Awaited<ReturnType<UsageControlsRepo["getRateLimitSettings"]>>;
  flaggedUsers: Awaited<ReturnType<UsageControlsRepo["listFlaggedUsers"]>>;
  chatbotMetrics: Awaited<ReturnType<UsageControlsRepo["getChatbotMetrics"]>>;
  chatbotRateLimitPolicy: Awaited<
    ReturnType<UsageControlsRepo["getChatbotRateLimitPolicy"]>
  >;
  chatbotSystemPolicy: Awaited<
    ReturnType<UsageControlsRepo["getChatbotSystemPolicy"]>
  >;
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & {
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message ?? "Usage controls request failed.");
  }
  return payload;
}

async function getState(): Promise<UsageControlsStateResponse> {
  const response = await fetch("/api/admin/usage-controls", {
    method: "GET",
    cache: "no-store",
  });
  return readJson<UsageControlsStateResponse>(response);
}

async function postAction<T>(action: string, payload: unknown): Promise<T> {
  const response = await fetch("/api/admin/usage-controls", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  return readJson<T>(response);
}

export function createSupabaseUsageControlsRepo(): UsageControlsRepo {
  return {
    async getRateLimitSettings() {
      const state = await getState();
      return state.rateLimitSettings;
    },
    async updateRateLimitSettings(input) {
      const result = await postAction<{
        rateLimitSettings: Awaited<ReturnType<UsageControlsRepo["getRateLimitSettings"]>>;
      }>("update_rate_limit", input);
      return result.rateLimitSettings;
    },
    async listFlaggedUsers() {
      const state = await getState();
      return state.flaggedUsers;
    },
    async getChatbotMetrics() {
      const state = await getState();
      return state.chatbotMetrics;
    },
    async getChatbotRateLimitPolicy() {
      const state = await getState();
      return state.chatbotRateLimitPolicy;
    },
    async updateChatbotRateLimitPolicy(input) {
      const result = await postAction<{
        chatbotRateLimitPolicy: Awaited<
          ReturnType<UsageControlsRepo["getChatbotRateLimitPolicy"]>
        >;
      }>("update_chatbot_rate_limit", input);
      return result.chatbotRateLimitPolicy;
    },
    async getChatbotSystemPolicy() {
      const state = await getState();
      return state.chatbotSystemPolicy;
    },
    async updateChatbotSystemPolicy(input) {
      const result = await postAction<{
        chatbotSystemPolicy: Awaited<
          ReturnType<UsageControlsRepo["getChatbotSystemPolicy"]>
        >;
      }>("update_chatbot_system_policy", input);
      return result.chatbotSystemPolicy;
    },
    async getUserAuditHistory(userId) {
      const response = await fetch(
        `/api/admin/usage-controls?userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );
      const payload = await readJson<{
        entries: Awaited<ReturnType<UsageControlsRepo["getUserAuditHistory"]>>;
      }>(response);
      return payload.entries;
    },
    async temporarilyBlockUser(input) {
      await postAction("block_user", input);
    },
    async unblockUser(input) {
      await postAction("unblock_user", input);
    },
  };
}
