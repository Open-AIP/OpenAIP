import type { AipStatus } from "@/lib/contracts/databasev2/enums";
import {
  DASHBOARD_AIP_STATUS_CHART_COLORS,
  DASHBOARD_SEMANTIC_COLORS,
} from "@/lib/ui/tokens";

type DashboardSelectOption = {
  label: string;
  value: string | number;
};

export const DBV2_SECTOR_CODES = ["1000", "3000", "8000", "9000"] as const;
export type DashboardSectorCode = (typeof DBV2_SECTOR_CODES)[number];
export type DashboardSectorFilter = DashboardSectorCode | "all";

const SECTOR_LABEL_BY_CODE: Record<DashboardSectorCode, string> = {
  "1000": "General Services",
  "3000": "Social Services",
  "8000": "Economic Services",
  "9000": "Other Services",
};

const SECTOR_SHORT_LABEL_BY_CODE: Record<DashboardSectorCode, string> = {
  "1000": "General",
  "3000": "Social",
  "8000": "Economic",
  "9000": "Other",
};

const NORMALIZED_SECTOR_TO_CODE: Record<string, DashboardSectorCode> = {
  "1000": "1000",
  "3000": "3000",
  "8000": "8000",
  "9000": "9000",
  general: "1000",
  "general services": "1000",
  social: "3000",
  "social services": "3000",
  economic: "8000",
  "economic services": "8000",
  other: "9000",
  "other services": "9000",
};

export const DASHBOARD_AIP_STATUS_ORDER: AipStatus[] = [
  "draft",
  "pending_review",
  "under_review",
  "for_revision",
  "published",
];

export const DASHBOARD_AIP_STATUS_COLORS: Record<AipStatus, string> = DASHBOARD_AIP_STATUS_CHART_COLORS;

export const SECTOR_OPTIONS = DBV2_SECTOR_CODES.map((code) => ({
  code,
  label: SECTOR_LABEL_BY_CODE[code],
  shortLabel: SECTOR_SHORT_LABEL_BY_CODE[code],
}));

export function toDashboardSectorCode(value: string): DashboardSectorCode | null {
  const normalized = value.trim().toLowerCase();
  return NORMALIZED_SECTOR_TO_CODE[normalized] ?? null;
}

export function getSectorShortLabel(code: DashboardSectorCode): string {
  return SECTOR_SHORT_LABEL_BY_CODE[code];
}

export function getSectorLabel(code: DashboardSectorCode): string {
  return SECTOR_LABEL_BY_CODE[code];
}

export const DASHBOARD_SECTOR_FILTER_OPTIONS: DashboardSelectOption[] = [
  { label: "All Categories", value: "all" },
  ...SECTOR_OPTIONS.map((sector) => ({ label: sector.shortLabel, value: sector.code })),
];

export const CITY_TOP_PROJECT_CATEGORY_OPTIONS: DashboardSelectOption[] = [
  ...DASHBOARD_SECTOR_FILTER_OPTIONS,
];

export const CITY_TOP_PROJECT_TYPE_OPTIONS: DashboardSelectOption[] = [
  { label: "All Types", value: "all" },
  { label: "Health", value: "health" },
  { label: "Infrastructure", value: "infrastructure" },
  { label: "Other", value: "other" },
];

export const CITY_PENDING_REVIEW_AGING_BAR_FILL = DASHBOARD_SEMANTIC_COLORS.teal700;
export const ADMIN_ERROR_RATE_BAR_FILL = DASHBOARD_SEMANTIC_COLORS.danger;
export const ADMIN_CHATBOT_USAGE_STROKE = DASHBOARD_SEMANTIC_COLORS.cyan800;
