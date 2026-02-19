import "server-only";

import { selectRepo } from "@/lib/repos/_shared/selector";
import type { ChatRepo } from "./repo";
import { createMockChatRepo } from "./repo.mock";
import { createSupabaseChatRepo } from "./repo.supabase";

export function getChatRepo(): ChatRepo {
  return selectRepo({
    label: "ChatRepo",
    mock: () => createMockChatRepo(),
    supabase: () => createSupabaseChatRepo(),
  });
}

