import type { AipStatus } from "@/lib/contracts/databasev2";

export type AipStatusBadgeVM = {
  status: AipStatus;
  label: string;
  badgeClass: string;
};
