import type { AipDetails, AipListItem } from "@/lib/types/viewmodels/citizen-aips.vm";
import type { AipProjectRow } from "@/lib/repos/aip/types";

export type CitizenAipRepo = {
  listAips(): Promise<AipListItem[]>;
  getAipDetails(aipId: string): Promise<AipDetails>;
  listFiscalYearOptions(): Promise<string[]>;
  listLguOptions(): Promise<string[]>;
  getDefaultAipId(): Promise<string>;
  getLatestAipProjectRows(): Promise<AipProjectRow[]>;
  getDefaultLguLabel(): Promise<string>;
};
