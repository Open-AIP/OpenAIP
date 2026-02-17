"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BarangayDashboardPage as BarangayDashboardScreen } from "@/features/dashboard/barangay";
import type { BarangayDashboardActions } from "@/features/dashboard/barangay/types/dashboard-actions";

export default function BarangayDashboardPage() {
  const router = useRouter();

  const actions = useMemo<BarangayDashboardActions>(
    () => ({
      onViewAip: ({ fiscal_year }) => {
        const params = new URLSearchParams();
        if (fiscal_year) params.set("fiscal_year", String(fiscal_year));
        const query = params.toString();
        router.push(query ? `/barangay/aips?${query}` : "/barangay/aips");
      },
      onUploadAip: ({ fiscal_year } = {}) => {
        const params = new URLSearchParams();
        if (fiscal_year) params.set("fiscal_year", String(fiscal_year));
        params.set("intent", "upload");
        router.push(`/barangay/aips?${params.toString()}`);
      },
      onViewProjects: ({ sector_code, fiscal_year } = {}) => {
        const params = new URLSearchParams();
        if (sector_code) params.set("sector_code", sector_code);
        if (fiscal_year) params.set("fiscal_year", String(fiscal_year));
        const query = params.toString();
        router.push(query ? `/barangay/projects/health?${query}` : "/barangay/projects/health");
      },
      onViewAuditTrail: () => {
        router.push("/barangay/audit");
      },
    }),
    [router]
  );

  return <BarangayDashboardScreen actions={actions} />;
}