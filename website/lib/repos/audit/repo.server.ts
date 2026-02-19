import "server-only";

import { selectRepo } from "@/lib/repos/_shared/selector";
import type { AuditRepo } from "./repo";
import { createMockAuditRepo } from "./repo.mock";
import { createSupabaseAuditRepo } from "./repo.supabase";

export function getAuditRepo(): AuditRepo {
  return selectRepo({
    label: "AuditRepo",
    mock: () => createMockAuditRepo(),
    supabase: () => createSupabaseAuditRepo(),
  });
}

