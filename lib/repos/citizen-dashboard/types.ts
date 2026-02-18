import type {
  AipReviewRow,
  AipRow,
  BarangayRow,
  CityRow,
  ProjectRow,
  SectorRow,
  UploadedFileRow,
} from "@/lib/contracts/databasev2";
import type { AipPublicStatusRow } from "@/mocks/fixtures/citizen/citizen-dashboard.fixture";

export type CitizenScopeType = "city" | "barangay";

export type CitizenDashboardFilters = {
  scope_type: CitizenScopeType;
  scope_id: string;
  fiscal_year: number;
  search: string;
};

export type CitizenDashboardData = {
  resolvedFilters: CitizenDashboardFilters;
  activeCities: CityRow[];
  activeBarangays: BarangayRow[];
  sectors: SectorRow[];
  publishedAips: AipRow[];
  projects: ProjectRow[];
  aipReviews: AipReviewRow[];
  uploadedFiles: UploadedFileRow[];
  publicStatusRows: AipPublicStatusRow[];
};

export type CitizenDashboardRepo = {
  getDashboard(filters: CitizenDashboardFilters): Promise<CitizenDashboardData>;
};

