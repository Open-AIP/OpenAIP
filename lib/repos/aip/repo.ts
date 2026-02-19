import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockAipProjectRepo, createMockAipRepoImpl } from "./repo.mock";

import type {
  AipDetail,
  AipListItem,
  AipProjectRow,
  AipStatus,
  CreateMockAipRepoOptions,
  LguScope,
  ListVisibleAipsInput,
  SubmitReviewInput,
  SubmitReviewProjectUpdates,
} from "./types";

export type {
  AipDetail,
  AipHeader,
  AipListItem,
  AipProjectRow,
  AipStatus,
  CreateMockAipRepoOptions,
  LguScope,
  ListVisibleAipsInput,
  ProjectKind,
  ReviewStatus,
  reviewStatus,
  Sector,
  SubmitReviewInput,
  SubmitReviewProjectUpdates,
} from "./types";

// [DATAFLOW] UI/pages should depend on this interface, not on a concrete adapter.
// [DBV2] Backing table is `public.aips` (enum `public.aip_status`).
export interface AipRepo {
  listVisibleAips(
    input: ListVisibleAipsInput,
    actor?: import("@/lib/domain/actor-context").ActorContext
  ): Promise<AipListItem[]>;
  getAipDetail(
    aipId: string,
    actor?: import("@/lib/domain/actor-context").ActorContext
  ): Promise<AipDetail | null>;
  updateAipStatus(
    aipId: string,
    next: AipStatus,
    actor?: import("@/lib/domain/actor-context").ActorContext
  ): Promise<void>;
}

// [DATAFLOW] Used by AIP detail views to list rows/projects under an AIP and submit review notes.
export interface AipProjectRepo {
  listByAip(aipId: string): Promise<AipProjectRow[]>;
  submitReview(input: SubmitReviewInput): Promise<void>;
}

export function getAipRepo(options: CreateMockAipRepoOptions = {}): AipRepo {
  return selectRepo({
    label: "AipRepo",
    mock: () => createMockAipRepoImpl(options),
    supabase: () => {
      throw new NotImplementedError(
        "AipRepo is server-only outside mock mode. Import from `@/lib/repos/aip/repo.server`."
      );
    },
  });
}

export function getAipProjectRepo(_scope?: LguScope): AipProjectRepo {
  return selectRepo({
    label: "AipProjectRepo",
    mock: () => createMockAipProjectRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "AipProjectRepo is server-only outside mock mode. Import from `@/lib/repos/aip/repo.server`."
      );
    },
  });
}
