"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CityDashboardView } from "@/features/dashboard/city";
import type { CityDashboardActions } from "@/features/dashboard/city/types/dashboard-actions";

export default function CityDashboardPage() {
  const router = useRouter();

  const actions = useMemo<CityDashboardActions>(
    () => ({
      onViewAip: ({ aip_id, fiscal_year }) => {
        if (aip_id) {
          router.push(`/city/aips/${aip_id}`);
          return;
        }

        const params = new URLSearchParams();
        if (fiscal_year) params.set("fiscal_year", String(fiscal_year));
        const query = params.toString();
        router.push(query ? `/city/aips?${query}` : "/city/aips");
      },
      onUploadAip: ({ fiscal_year } = {}) => {
        const params = new URLSearchParams();
        if (fiscal_year) params.set("fiscal_year", String(fiscal_year));
        params.set("intent", "upload");
        router.push(`/city/aips?${params.toString()}`);
      },
      onViewProjects: ({ sector_code, fiscal_year } = {}) => {
        const params = new URLSearchParams();
        if (sector_code) params.set("sector_code", sector_code);
        if (fiscal_year) params.set("fiscal_year", String(fiscal_year));
        const query = params.toString();
        router.push(query ? `/city/projects?${query}` : "/city/projects");
      },
      onViewAuditTrail: () => {
        router.push("/city/audit");
      },
      onOpenProjectUpdate: ({ project_id }) => {
        const params = new URLSearchParams();
        params.set("project_id", project_id);
        router.push(`/city/projects?${params.toString()}`);
      },
    }),
    [router]
  );

  return <CityDashboardView actions={actions} />;
}