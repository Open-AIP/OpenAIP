import { getAppEnv } from "@/shared/config/appEnv";
import { NotImplementedError } from "@/shared/errors/notImplemented";
import type { AipProjectRepo } from "../data/aip-project-repo";
import { createMockAipProjectRepo } from "./aip-project-repo.mock";

/**
 * Central selector: decide which repo to use.
 * - dev => mock
 * - staging/prod => throw until Supabase repo exists
 */
export function getAipProjectRepo(): AipProjectRepo {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockAipProjectRepo();
  }

  throw new NotImplementedError(
    `AipProjectRepo not implemented for env="${env}". Expected until Supabase repo is added.`
  );
}

