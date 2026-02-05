import { getAppEnv } from "@/shared/config/appEnv";
import { NotImplementedError } from "@/shared/errors/notImplemented";
import type { SubmissionsRepo } from "./SubmissionsRepo";
import { createMockSubmissionsRepo } from "./submissionsRepo.mock";

export function getSubmissionsRepo(): SubmissionsRepo {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockSubmissionsRepo();
  }

  throw new NotImplementedError(
    `SubmissionsRepo not implemented for env="${env}". Expected until Supabase repo is added.`
  );
}

