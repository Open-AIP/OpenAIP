import { getAppEnv } from "@/shared/config/appEnv";
import { NotImplementedError } from "@/shared/errors/notImplemented";
import type { AuditRepo } from "./repo";
import { createMockAuditRepo } from "./repo.mock";

export function getAuditRepo(): AuditRepo {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockAuditRepo();
  }

  // [SUPABASE-SWAP] Add an `AuditRepo` Supabase adapter (read-only from UI) and switch here.
  throw new NotImplementedError(
    `AuditRepo not implemented for env="${env}". Expected until Supabase repo is added.`
  );
}

