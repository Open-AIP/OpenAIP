import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockLguRepoImpl } from "./repo.mock";

export type {
  BarangayParentType,
  CreateLguInput,
  LguRecord,
  LguStatus,
  LguType,
  UpdateLguInput,
} from "./types";

import type { CreateLguInput, LguRecord, LguStatus, UpdateLguInput } from "./types";

export interface LguRepo {
  list(): Promise<LguRecord[]>;
  create(input: CreateLguInput): Promise<LguRecord>;
  update(id: string, patch: UpdateLguInput): Promise<LguRecord>;
  setStatus(id: string, status: LguStatus): Promise<LguRecord>;
}

export function getLguRepo(): LguRepo {
  return selectRepo({
    label: "LguRepo",
    mock: () => createMockLguRepoImpl(),
    supabase: () => {
      throw new NotImplementedError(
        "LguRepo is server-only outside mock mode. Import from `@/lib/repos/lgu/repo.server`."
      );
    },
  });
}
