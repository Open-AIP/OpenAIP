import { getAppEnv } from "@/shared/config/appEnv";
import { NotImplementedError } from "@/shared/errors/notImplemented";
import type { AipRepo } from "../data/aip-repo";
import {
  createMockAipRepoImpl,
  type CreateMockAipRepoOptions,
} from "./aip-repo.mock-impl";

/**
 * Central selector: decide which repo to use.
 * - dev => mock
 * - staging/prod => throw until Supabase repo exists
 * - [SUPABASE-SWAP] Implement a Supabase adapter for `AipRepo` and switch here without touching UI/pages.
 */
export function getAipRepo(
  options: CreateMockAipRepoOptions = {}
): AipRepo {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockAipRepoImpl(options);
  }

  throw new NotImplementedError(
    `AipRepo not implemented for env="${env}". Expected until Supabase repo is added.`
  );
}
