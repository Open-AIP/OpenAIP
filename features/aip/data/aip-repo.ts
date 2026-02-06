import type { AipHeader, AipStatus, LguScope } from "../types";

export type AipListItem = AipHeader;
export type AipDetail = AipHeader;

export type ListVisibleAipsInput = {
  visibility?: "public" | "my";
  scope?: LguScope;
};

// [DATAFLOW] UI/pages should depend on this interface, not on a concrete adapter.
// [DBV2] Backing table is `public.aips` (enum `public.aip_status`). Public visibility is `status <> 'draft'`;
//        draft rows are visible only to owning officials/admin (RLS via `aips_select_policy` / `can_read_aip`).
// [SUPABASE-SWAP] Implement a `*.supabase.ts` adapter that relies on RLS for scope + reviewer rules; keep filters explicit for UX.
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
