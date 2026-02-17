export type BarangayDashboardActions = {
  onViewAip: (args: { fiscal_year?: number | string }) => void;
  onUploadAip: (args?: { fiscal_year?: number | string }) => void;
  onViewProjects: (args?: { sector_code?: string; fiscal_year?: number | string }) => void;
  onViewAuditTrail?: () => void;
};
