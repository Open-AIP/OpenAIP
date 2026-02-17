import { getBarangayDashboardRepo as getRepo } from "@/lib/repos/barangay-dashboard/repo";

export type {
  BarangayDashboardData,
  BarangayDashboardFilters,
  BarangayDashboardRepo,
} from "@/lib/repos/barangay-dashboard/repo";

export function getBarangayDashboardRepo() {
  return getRepo();
}
