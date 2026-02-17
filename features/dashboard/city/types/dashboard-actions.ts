export type CityDashboardActions = {
  onViewAip: (args: {
    aip_id?: string;
    barangay_id?: string;
    fiscal_year?: number | string;
  }) => void;
  onUploadAip: (args?: { fiscal_year?: number | string }) => void;
  onViewProjects: (args?: { sector_code?: string; fiscal_year?: number | string }) => void;
  onViewAuditTrail?: () => void;
  onOpenProjectUpdate?: (args: { project_id: string }) => void;
};
