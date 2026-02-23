import { BarangayDashboardView } from "@/features/dashboard";

export default async function BarangayDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; q?: string; tableQ?: string; category?: string; sector?: string; kpi?: string }>;
}) {
  return <BarangayDashboardView searchParams={searchParams} />;
}
