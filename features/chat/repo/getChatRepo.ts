import { createMockChatRepo } from "./mock/createMockChatRepo";
import type { ChatRepo } from "./ChatRepo";

// [SUPABASE-SWAP] This selector currently always returns the mock repo; update it to switch by env once `createSupabaseChatRepo()` is implemented.
export function getChatRepo(): ChatRepo {
  return createMockChatRepo();
}
