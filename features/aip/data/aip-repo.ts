import type { AipHeader, AipStatus, LguScope } from "../types";

export type AipListItem = AipHeader;
export type AipDetail = AipHeader;

export type ListVisibleAipsInput = {
  visibility?: "public" | "my";
  scope?: LguScope;
};

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
