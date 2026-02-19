import type { DashboardSectorCode } from "@/lib/constants/dashboard";

export const SECTOR_CODE_TO_LABEL: Record<DashboardSectorCode, string> = {
  "1000": "General",
  "3000": "Social",
  "8000": "Economic",
  "9000": "Other",
};

export function formatSectorLabel(sector_code: DashboardSectorCode): string {
  return SECTOR_CODE_TO_LABEL[sector_code] ?? "Other";
}
