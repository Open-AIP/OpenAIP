import { createMockChatRepo as createMockChatRepoImpl } from "../../data/chat.mock";
import { ChatRepoErrors } from "../ChatRepo";
import type { ChatMessageRole, ChatRepo } from "../ChatRepo";

export function createMockChatRepo(): ChatRepo {
  return createMockChatRepoImpl();
}

export async function __unsafeAddMessage(
  repo: ChatRepo,
  sessionId: string,
  role: ChatMessageRole,
  content: string
) {
  if (role !== "user") {
    throw new Error(ChatRepoErrors.INVALID_ROLE);
  }

  return repo.appendUserMessage(sessionId, content);
}
