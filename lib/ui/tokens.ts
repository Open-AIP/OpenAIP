import type { AipStatus } from "@/lib/contracts/databasev2/enums";

export const DASHBOARD_TAG_TONE_STYLES: Record<"info" | "warning" | "danger", string> = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
};

export const DASHBOARD_CHART_PALETTE = ["#0f766e", "#2563eb", "#10b981", "#f59e0b", "#7c3aed"] as const;

export const DASHBOARD_CHART_STROKES = {
  grid: "#cbd5e1",
  axis: "#64748b",
  svgGrid: "#e2e8f0",
} as const;

export const DASHBOARD_SEMANTIC_COLORS = {
  info: "#2563eb",
  success: "#22c55e",
  warning: "#eab308",
  danger: "#ef4444",
  neutral: "#94a3b8",
  teal700: "#0f766e",
  cyan800: "#0E5D6F",
  emerald500: "#10b981",
  amber500: "#f59e0b",
} as const;

export const DASHBOARD_AIP_STATUS_CHART_COLORS: Record<AipStatus, string> = {
  draft: "#94a3b8",
  pending_review: "#eab308",
  under_review: "#3b82f6",
  for_revision: "#f97316",
  published: "#22c55e",
};

export const DASHBOARD_BUDGET_SEGMENT_HEX_BY_TEXT_CLASS: Record<string, string> = {
  "text-blue-500": "#3b82f6",
  "text-teal-700": "#0f766e",
  "text-emerald-500": "#10b981",
  "text-amber-500": "#f59e0b",
};

export const DASHBOARD_BUDGET_SEGMENT_DOT_CLASS_BY_TEXT_CLASS: Record<string, string> = {
  "text-blue-500": "bg-blue-500",
  "text-teal-700": "bg-teal-700",
  "text-emerald-500": "bg-emerald-500",
  "text-amber-500": "bg-amber-500",
};

export const CITIZEN_DASHBOARD_TOKENS = {
  heroGradientClass: "bg-gradient-to-br from-[#022437] via-[#0B3440] to-[#114B59]",
  heroAccentTextClass: "text-[#67E8F9]",
  searchPillSurfaceClass: "bg-[#D3DBE0]",
  primaryButtonClass: "bg-[#0E7490] text-white hover:bg-[#0C6078]",
  reviewBacklogButtonClass: "w-full bg-[#0E5D6F] text-white hover:bg-[#0E5D6F]/90",
} as const;

export function getChartColorByIndex(index: number, palette: readonly string[] = DASHBOARD_CHART_PALETTE): string {
  if (palette.length === 0) return DASHBOARD_SEMANTIC_COLORS.neutral;
  return palette[index % palette.length];
}
