import { getAppEnv } from "@/lib/config/appEnv";
import { NotImplementedError } from "@/lib/core/errors";
import type { LguRepo } from "./repo";
import { createMockLguRepoImpl } from "./repo.mock";

export function getLguRepo(): LguRepo {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockLguRepoImpl();
  }

  throw new NotImplementedError(
    `LguRepo not implemented for env="${env}". Expected until Supabase repo is added.`
  );
}
