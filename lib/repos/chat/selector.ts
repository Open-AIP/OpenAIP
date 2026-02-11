import { getAppEnv } from "@/lib/config/appEnv";
import { NotImplementedError } from "@/lib/core/errors";
import type { ChatRepo } from "./repo";
import { createMockChatRepo } from "./repo.mock";

export function getChatRepo(): ChatRepo {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockChatRepo();
  }

  // [SUPABASE-SWAP] Add a `ChatRepo` Supabase adapter and switch here.
  throw new NotImplementedError(
    `ChatRepo not implemented for env="${env}". Expected until Supabase repo is added.`
  );
}
