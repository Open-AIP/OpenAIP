import type { AipHeader, AipStatus, LguScope } from "../types";

export type AipListItem = AipHeader;
export type AipDetail = AipHeader;

export type ListVisibleAipsInput = {
  visibility?: "public" | "my";
  scope?: LguScope;
};

export interface AipRepo {
  listVisibleAips(input: ListVisibleAipsInput): Promise<AipListItem[]>;
  getAipDetail(aipId: string): Promise<AipDetail | null>;
  updateAipStatus(aipId: string, next: AipStatus): Promise<void>;
}
