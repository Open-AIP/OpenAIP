"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getAdminDashboardRepo } from "@/lib/repos/admin-dashboard/repo";
import type {
  AdminDashboardFilters,
  AipStatusDistributionVM,
  DashboardSummaryVM,
  LguOptionVM,
  RecentActivityItemVM,
  ReviewBacklogVM,
  UsageMetricsVM,
} from "@/lib/repos/admin-dashboard/types";
import { Users, Building2, MessageSquare, FileText } from "lucide-react";
import { formatNumber } from "@/lib/formatting";

const createDefaultFilters = (): AdminDashboardFilters => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 13);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
    lguScope: "all",
    lguId: null,
    aipStatus: "all",
  };
};

export default function AdminDashboardView() {
  const repo = useMemo(() => getAdminDashboardRepo(), []);
  const router = useRouter();
  const [filters, setFilters] = useState<AdminDashboardFilters>(() => createDefaultFilters());
  const [summary, setSummary] = useState<DashboardSummaryVM | null>(null);
  const [distribution, setDistribution] = useState<AipStatusDistributionVM[]>([]);
  const [reviewBacklog, setReviewBacklog] = useState<ReviewBacklogVM | null>(null);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetricsVM | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItemVM[]>([]);
  const [lguOptions, setLguOptions] = useState<LguOptionVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryData,
        statusDistribution,
        backlogData,
        metricsData,
        activityData,
        lguList,
      ] = await Promise.all([
        repo.getSummary(filters),
        repo.getAipStatusDistribution(filters),
        repo.getReviewBacklog(filters),
        repo.getUsageMetrics(filters),
        repo.getRecentActivity(filters),
        repo.listLguOptions(),
      ]);
      setSummary(summaryData);
      setDistribution(statusDistribution);
      setReviewBacklog(backlogData);
      setUsageMetrics(metricsData);
      setRecentActivity(activityData);
      setLguOptions(lguList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [filters, repo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

  const handleReset = () => setFilters(createDefaultFilters());

  const handleStatusClick = (status: string) => {
    const query = buildQuery({ status });
    router.push(`/admin/aip-monitoring?${query}`);
  };

  const safeSummary = summary ?? {
    totalLgus: 0,
    activeUsers: 0,
    flaggedComments: 0,
    reviewBacklog: 0,
    deltaLabels: {
      totalLgus: "",
      activeUsers: "",
      flaggedComments: "",
      reviewBacklog: "",
    },
    elevatedFlags: { flaggedComments: false, reviewBacklog: false },
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
        lguOptions={lguOptions}
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
          title="Total LGUs"
          value={formatNumber(safeSummary.totalLgus)}
          deltaLabel={safeSummary.deltaLabels.totalLgus}
          icon={Building2}
          iconClassName="bg-blue-50 text-blue-600"
          ctaLabel="View LGUs"
          ctaHref={`/admin/lgu-management?${buildQuery()}`}
        />
        <KpiCard
          title="Active Users"
          value={formatNumber(safeSummary.activeUsers)}
          deltaLabel={safeSummary.deltaLabels.activeUsers}
          icon={Users}
          iconClassName="bg-emerald-50 text-emerald-600"
          ctaLabel="View Accounts"
          ctaHref={`/admin/account-administration?${buildQuery()}`}
        />
        <KpiCard
          title="Flagged Comments"
          value={formatNumber(safeSummary.flaggedComments)}
          deltaLabel={safeSummary.deltaLabels.flaggedComments}
          icon={MessageSquare}
          iconClassName="bg-amber-50 text-amber-600"
          ctaLabel="View Content"
          ctaHref={`/admin/feedback-moderation?${buildQuery()}`}
          tagLabel={safeSummary.elevatedFlags.flaggedComments ? "Elevated" : undefined}
          tagTone="warning"
        />
        <KpiCard
          title="Review Backlog"
          value={formatNumber(safeSummary.reviewBacklog)}
          deltaLabel={safeSummary.deltaLabels.reviewBacklog}
          icon={FileText}
          iconClassName="bg-rose-50 text-rose-600"
          ctaLabel="View AIPs"
          ctaHref={`/admin/aip-monitoring?${buildQuery()}`}
          tagLabel={safeSummary.elevatedFlags.reviewBacklog ? "Elevated" : undefined}
          tagTone="warning"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <AipStatusDonutCard
          data={distribution}
          onStatusClick={handleStatusClick}
        />
        {reviewBacklog && (
          <ReviewBacklogCard
            backlog={reviewBacklog}
            onViewAips={() => router.push(`/admin/aip-monitoring?${buildQuery()}`)}
          />
        )}
      </div>

      {usageMetrics && (
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <ErrorRateBarChart metrics={usageMetrics} />
            <ChatbotUsageLineChart metrics={usageMetrics} />
          </div>
          <MiniKpiStack metrics={usageMetrics} />
        </div>
      )}

      <RecentActivityList
        items={recentActivity}
        onViewAudit={() => router.push(`/admin/audit-logs?${buildQuery()}`)}
      />

      {loading && (
        <div className="text-[12px] text-slate-500">Refreshing dashboard metrics…</div>
      )}
    </div>
  );
}
