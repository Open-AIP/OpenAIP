"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, FolderKanban, MessageSquare, Wallet } from "lucide-react";
import { getAipStatusLabel } from "@/features/submissions/presentation/submissions.presentation";
import { getBarangayDashboardRepo } from "../repo/barangayDashboard.repo";
import {
  BARANGAY_DASHBOARD_DEFAULT_YEAR,
  BARANGAY_DASHBOARD_SCOPE,
} from "@/mocks/fixtures/barangay/barangay-dashboard.fixture";
import type {
  BarangayDashboardData,
  BarangayDashboardFilters,
  BarangayDashboardVM,
  TopProjectsFilterChange,
} from "../types";
import { formatNumber, formatPeso } from "@/lib/formatting";

const createDefaultFilters = (): BarangayDashboardFilters => ({
  year: BARANGAY_DASHBOARD_DEFAULT_YEAR,
  globalSearch: "",
  tableSearch: "",
  sector: "all",
  projectType: "all",
});

export function useBarangayDashboard() {
  const repo = useMemo(() => getBarangayDashboardRepo(), []);

  const [filters, setFilters] = useState<BarangayDashboardFilters>(createDefaultFilters);
  const [availableYears, setAvailableYears] = useState<number[]>([BARANGAY_DASHBOARD_DEFAULT_YEAR]);
  const [data, setData] = useState<BarangayDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadYears() {
      try {
        const years = await repo.listAvailableYears();
        if (!isActive || years.length === 0) return;
        setAvailableYears(years);
      } catch {
        if (!isActive) return;
      }
    }

    loadYears();

    return () => {
      isActive = false;
    };
  }, [repo]);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await repo.getDashboard(filters);
        if (!isActive) return;
        setData(result);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Failed to load barangay dashboard.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, [repo, filters]);

  const totalBudget = useMemo(() => {
    if (!data) return 0;
    return data.budgetBreakdown.reduce((sum, item) => sum + item.amount, 0);
  }, [data]);

  const setYear = (year: number) => {
    setFilters((prev) => ({ ...prev, year }));
  };

  const setGlobalSearch = (globalSearch: string) => {
    setFilters((prev) => ({ ...prev, globalSearch }));
  };

  const setTableSearch = (tableSearch: string) => {
    setFilters((prev) => ({ ...prev, tableSearch }));
  };

  const setSector = (sector: BarangayDashboardFilters["sector"]) => {
    setFilters((prev) => ({ ...prev, sector }));
  };

  const setProjectType = (projectType: BarangayDashboardFilters["projectType"]) => {
    setFilters((prev) => ({ ...prev, projectType }));
  };

  const setTopProjectsFilters = (change: TopProjectsFilterChange) => {
    setFilters((prev) => ({
      ...prev,
      tableSearch: change.search ?? prev.tableSearch,
      sector: (change.category as BarangayDashboardFilters["sector"]) ?? prev.sector,
      projectType: (change.type as BarangayDashboardFilters["projectType"]) ?? prev.projectType,
    }));
  };

  const viewModel: BarangayDashboardVM | null = useMemo(() => {
    if (!data) return null;

    return {
      header: {
        title: "Welcome to OpenAIP",
        year: filters.year,
        yearOptions: availableYears.map((year) => ({ label: String(year), value: year })),
        search: filters.globalSearch,
      },
      kpis: [
        {
          id: "aip-status",
          label: "AIP Status",
          value: getAipStatusLabel(data.aipStatus.status),
          subtext: `${data.aipStatus.asOfLabel} · ${data.aipStatus.lastUpdatedLabel}`,
          icon: FileText,
          tone: "warning",
        },
        {
          id: "projects",
          label: "Total Projects",
          value: formatNumber(data.totalProjects.total),
          subtext: `Health: ${data.totalProjects.healthCount} · Infra: ${data.totalProjects.infrastructureCount}`,
          icon: FolderKanban,
          tone: "info",
        },
        {
          id: "budget",
          label: "Total Budget",
          value: formatPeso(totalBudget),
          subtext: `Based on project totals for ${filters.year}`,
          icon: Wallet,
          tone: "success",
        },
        {
          id: "feedback",
          label: "Citizen Feedback",
          value: `${formatNumber(data.citizenFeedback.totalComments)} Comments`,
          subtext: `${data.citizenFeedback.awaitingReply} awaiting replies`,
          icon: MessageSquare,
          tone: "warning",
          badgeText: data.citizenFeedback.awaitingReply > 0 ? data.citizenFeedback.actionRequiredLabel : undefined,
        },
      ],
      budgetBreakdown: {
        totalBudget,
        segments: data.budgetBreakdown.map((item) => ({
          label: item.label,
          percent: item.percent,
          value: item.amount,
          colorClass: item.colorClass,
        })),
      },
      dateCard: { ...data.dateCard },
      workingOn: {
        isEmpty: data.workingOn.isCaughtUp,
        emptyLabel: data.workingOn.emptyLabel,
        items: data.workingOn.items.map((item) => ({ title: item.title, status: "Open", meta: item.href })),
      },
      topFunded: {
        rows: data.topFundedProjects.map((row) => ({
          id: row.id,
          rank: row.rank,
          projectName: row.projectName,
          category: row.sector,
          type: row.projectType,
          budget: row.budget,
          status: row.projectStatus,
        })),
        filters: {
          category: filters.sector,
          type: filters.projectType,
          search: filters.tableSearch,
        },
        categoryOptions: [
          { label: "All Categories", value: "all" },
          { label: "General", value: "General" },
          { label: "Social", value: "Social" },
          { label: "Economic", value: "Economic" },
          { label: "Other", value: "Other" },
        ],
        typeOptions: [
          { label: "All Types", value: "all" },
          { label: "Health", value: "health" },
          { label: "Infrastructure", value: "infrastructure" },
          { label: "Other", value: "other" },
        ],
      },
      recentProjectUpdates: data.recentProjectUpdates.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category === "health" ? "Health" : "Infrastructure",
        date: item.date,
        metaRight: `${formatNumber(item.attendees)} attendees`,
      })),
      cityAipCoverage: {
        status: data.cityAipStatus.hasCityAipForYear ? "available" : "missing",
        message: data.cityAipStatus.description,
        ctaLabel: `Upload City AIP for ${filters.year}`,
      },
      publicationTimeline: data.publicationTimeline.map((item) => ({ year: item.year, value: item.publishedCount })),
      cityAipsByYear: data.cityAipsByYear.map((item) => ({
        id: item.id,
        year: item.year,
        status: item.status,
        uploadedBy: item.uploadedBy,
        uploadDate: item.uploadDate,
      })),
      recentActivity: data.recentActivity.map((item) => ({
        id: item.id,
        title: item.action,
        timestamp: item.timestamp,
        tag: item.tag,
      })),
      pulseKpis: {
        newThisWeek: data.engagementPulse.newThisWeek,
        awaitingReply: data.engagementPulse.awaitingReply,
        hidden: data.engagementPulse.hidden,
      },
      trendSeries: data.engagementPulse.feedbackTrend,
      targetsSeries: data.engagementPulse.feedbackTargets,
      recentFeedback: data.recentFeedback.map((item) => ({
        id: item.id,
        scopeTag: "Feedback",
        title: item.title,
        snippet: item.subtitle,
        author: "Citizen",
        timeAgo: item.date,
      })),
      aipDetailsHref: data.budgetActions.aipDetailsHref,
      cityAipUploadLabel: `Upload City AIP for ${filters.year}`,
    };
  }, [availableYears, data, filters.globalSearch, filters.projectType, filters.sector, filters.tableSearch, filters.year, totalBudget]);

  return {
    scope: BARANGAY_DASHBOARD_SCOPE,
    filters,
    setFilters,
    data,
    isLoading,
    error,
    availableYears,
    totalBudget,
    setYear,
    setGlobalSearch,
    setTableSearch,
    setSector,
    setProjectType,
    setTopProjectsFilters,
    viewModel,
  };
}
