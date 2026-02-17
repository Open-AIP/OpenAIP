"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import KpiCard from "../components/KpiCard";
import DashboardFiltersRow from "../components/DashboardFiltersRow";
import AipStatusDonutCard from "../components/AipStatusDonutCard";
import ReviewBacklogCard from "../components/ReviewBacklogCard";
import ErrorRateBarChart from "../components/ErrorRateBarChart";
import ChatbotUsageLineChart from "../components/ChatbotUsageLineChart";
import MiniKpiStack from "../components/MiniKpiStack";
import RecentActivityList from "../components/RecentActivityList";
import { Users, Building2, MessageSquare, FileText } from "lucide-react";
import { useAdminDashboard } from "../hooks/useAdminDashboard";

export default function AdminDashboardView() {
  const router = useRouter();
  const { filters, setFilters, viewModel, loading, error, handleReset } = useAdminDashboard();

  const buildQuery = (extra?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set("from", filters.dateFrom);
    if (filters.dateTo) params.set("to", filters.dateTo);
    if (filters.lguScope !== "all") params.set("lguScope", filters.lguScope);
    if (filters.lguId) params.set("lguId", filters.lguId);
    if (filters.aipStatus !== "all") params.set("status", filters.aipStatus);
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => params.set(key, value));
    }
    return params.toString();
  };

  const handleStatusClick = (status: string) => {
    const query = buildQuery({ status });
    router.push(`/admin/aip-monitoring?${query}`);
  };

  return (
    <div className="space-y-8 text-[13.5px] text-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Read-only operational overview with drill-down access to oversight areas.
          </p>
        </div>
        <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">
          Read-only
        </Badge>
      </div>

      <DashboardFiltersRow
        filters={filters}
        lguOptions={viewModel.lguOptions}
        onChange={setFilters}
        onReset={handleReset}
      />

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title={viewModel.kpis[0].title}
          value={viewModel.kpis[0].value}
          deltaLabel={viewModel.kpis[0].deltaLabel}
          icon={Building2}
          iconClassName={viewModel.kpis[0].iconClassName}
          ctaLabel={viewModel.kpis[0].ctaLabel}
          ctaHref={viewModel.kpis[0].path}
        />
        <KpiCard
          title={viewModel.kpis[1].title}
          value={viewModel.kpis[1].value}
          deltaLabel={viewModel.kpis[1].deltaLabel}
          icon={Users}
          iconClassName={viewModel.kpis[1].iconClassName}
          ctaLabel={viewModel.kpis[1].ctaLabel}
          ctaHref={viewModel.kpis[1].path}
        />
        <KpiCard
          title={viewModel.kpis[2].title}
          value={viewModel.kpis[2].value}
          deltaLabel={viewModel.kpis[2].deltaLabel}
          icon={MessageSquare}
          iconClassName={viewModel.kpis[2].iconClassName}
          ctaLabel={viewModel.kpis[2].ctaLabel}
          ctaHref={viewModel.kpis[2].path}
          tagLabel={viewModel.kpis[2].tagLabel}
          tagTone="warning"
        />
        <KpiCard
          title={viewModel.kpis[3].title}
          value={viewModel.kpis[3].value}
          deltaLabel={viewModel.kpis[3].deltaLabel}
          icon={FileText}
          iconClassName={viewModel.kpis[3].iconClassName}
          ctaLabel={viewModel.kpis[3].ctaLabel}
          ctaHref={viewModel.kpis[3].path}
          tagLabel={viewModel.kpis[3].tagLabel}
          tagTone="warning"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <AipStatusDonutCard
          data={viewModel.distribution}
          onStatusClick={handleStatusClick}
        />
        {viewModel.reviewBacklog && (
          <ReviewBacklogCard
            backlog={viewModel.reviewBacklog}
            onViewAips={() => router.push(`/admin/aip-monitoring?${buildQuery()}`)}
          />
        )}
      </div>

      {viewModel.usageMetrics && (
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <ErrorRateBarChart metrics={viewModel.usageMetrics} />
            <ChatbotUsageLineChart metrics={viewModel.usageMetrics} />
          </div>
          <MiniKpiStack metrics={viewModel.usageMetrics} />
        </div>
      )}

      <RecentActivityList
        items={viewModel.recentActivity}
        onViewAudit={() => router.push(`/admin/audit-logs?${buildQuery()}`)}
      />

      {loading && (
        <div className="text-[12px] text-slate-500">Refreshing dashboard metrics…</div>
      )}
    </div>
  );
}
