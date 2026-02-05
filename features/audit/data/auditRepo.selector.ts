import { getAppEnv } from "@/shared/config/appEnv";
import { NotImplementedError } from "@/shared/errors/notImplemented";
import type { AuditRepo } from "./AuditRepo";
import { createMockAuditRepo } from "./auditRepo.mock";

export function getAuditRepo(): AuditRepo {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockAuditRepo();
  }

  throw new NotImplementedError(
    `AuditRepo not implemented for env="${env}". Expected until Supabase repo is added.`
  );
}

