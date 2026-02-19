import type { LguScopeKind } from "@/lib/auth/scope";

export type CitizenActions = {
  onSearch: (args: {
    scope_type: LguScopeKind;
    scope_id: string;
    fiscal_year: number | string;
  }) => void;
  onOpenDashboard?: () => void;
  onBrowseAips?: () => void;
  onOpenBudgetAllocation?: () => void;
  onExploreProjects?: (args?: { sector_code?: string }) => void;
};
