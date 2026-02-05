import { createMockChatRepo } from "./mock/createMockChatRepo";
import type { ChatRepo } from "./ChatRepo";

export function getChatRepo(): ChatRepo {
  return createMockChatRepo();
}
