import { BARANGAY_DASHBOARD_MOCK, CITY_DASHBOARD_MOCK } from "@/mock/dashboard/dashboard-mock-payload";
import { isMockEnabled } from "@/lib/config/appEnv";

export function getDashboardSource() {
  const enabled = String(process.env.USE_MOCK_DASHBOARD ?? "").toLowerCase();
  const explicitDashboardMock = enabled === "1" || enabled === "true" || enabled === "yes";
  const useMock = explicitDashboardMock || isMockEnabled();
  return {
    useMock,
    barangayMock: BARANGAY_DASHBOARD_MOCK,
    cityMock: CITY_DASHBOARD_MOCK,
  };
}
