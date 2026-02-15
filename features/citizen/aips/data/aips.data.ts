
import type { AipDetails, AipListItem } from "@/features/citizen/aips/types";
import { getCitizenAipRepo } from "@/lib/repos/citizen-aips/repo";

const repo = getCitizenAipRepo();

export const getCitizenAipList = (): Promise<AipListItem[]> => repo.listAips();

export const getCitizenAipDetails = (aipId: string): Promise<AipDetails> => repo.getAipDetails(aipId);

export const getCitizenAipFilters = async (): Promise<{
  fiscalYearOptions: string[];
  lguOptions: string[];
  defaultAipId: string;
}> => {
  const [fiscalYearOptions, lguOptions, defaultAipId] = await Promise.all([
    repo.listFiscalYearOptions(),
    repo.listLguOptions(),
    repo.getDefaultAipId(),
  ]);

  return { fiscalYearOptions, lguOptions, defaultAipId };
};
