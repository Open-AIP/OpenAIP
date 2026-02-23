import { BARANGAY_DASHBOARD_MOCK, CITY_DASHBOARD_MOCK } from "@/mock/dashboard/dashboard-mock-payload";

export function getDashboardSource() {
  const enabled = String(process.env.USE_MOCK_DASHBOARD ?? "").toLowerCase();
  const useMock = enabled === "1" || enabled === "true" || enabled === "yes";
  return {
    useMock,
    barangayMock: BARANGAY_DASHBOARD_MOCK,
    cityMock: CITY_DASHBOARD_MOCK,
  };
}
