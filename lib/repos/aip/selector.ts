import { getAppEnv } from "@/lib/config/appEnv";
import { NotImplementedError } from "@/lib/errors/notImplemented";
import type { AipProjectRepo, AipRepo, LguScope } from "./repo";
import {
  createMockAipProjectRepo,
  createMockAipRepoImpl,
  type CreateMockAipRepoOptions,
} from "./repo.mock";

export type { CreateMockAipRepoOptions };

export function getAipRepo(options: CreateMockAipRepoOptions = {}): AipRepo {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockAipRepoImpl(options);
  }

  throw new NotImplementedError(
    `AipRepo not implemented for env="${env}". Expected until Supabase repo is added.`
  );
}

export function getAipProjectRepo(_scope?: LguScope): AipProjectRepo {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockAipProjectRepo();
  }

  throw new NotImplementedError(
    `AipProjectRepo not implemented for env="${env}". Expected until Supabase repo is added.`
  );
}
