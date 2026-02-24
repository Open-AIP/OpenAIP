import { CityDashboardView } from "@/features/dashboard";

export default async function CityDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; q?: string; tableQ?: string; category?: string; sector?: string; kpi?: string }>;
}) {
  return <CityDashboardView searchParams={searchParams} />;
}
