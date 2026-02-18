"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clock3,
  FileText,
  Heart,
  Landmark,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChartCard } from "@/features/dashboard/shared/components/charts";
import { formatDate, formatPeso } from "@/lib/formatting";
import { mapCitizenDashboardToVM } from "@/lib/mappers/dashboard/citizen";
import { getCitizenDashboardRepo } from "@/lib/repos/citizen-dashboard";
import type { CitizenDashboardFilters, CitizenScopeType } from "@/lib/repos/citizen-dashboard";
import type {
  CitizenDashboardCategoryAllocationVM,
  CitizenDashboardTransparencyStepVM,
  CitizenDashboardVM,
} from "@/lib/types/viewmodels/dashboard";
import { CITIZEN_DASHBOARD_TOKENS } from "@/lib/ui/tokens";
You MUST separate each major dashboard section into its own component inside a dedicated “components” folder within the feature module.
const CATEGORY_LAYOUT = ["General Services", "Social Services", "Economic Services", "Other Services"] as const;

function parseScopeType(value: string | null): CitizenScopeType {
  return value === "barangay" ? "barangay" : "city";
}

function parseFiscalYear(value: string | null): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 2000 && parsed <= 2100) return parsed;
  return new Date().getFullYear();
}

function readFiltersFromUrl(searchParams: URLSearchParams): CitizenDashboardFilters {
  return {
    scope_type: parseScopeType(searchParams.get("scope_type")),
    scope_id: searchParams.get("scope_id") ?? "",
    fiscal_year: parseFiscalYear(searchParams.get("fiscal_year")),
    search: searchParams.get("q") ?? "",
  };
}

function filtersToParams(filters: CitizenDashboardFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set("scope_type", filters.scope_type);
  if (filters.scope_id) params.set("scope_id", filters.scope_id);
  params.set("fiscal_year", String(filters.fiscal_year));
  if (filters.search.trim()) params.set("q", filters.search.trim());
  return params;
}

function filtersEqual(a: CitizenDashboardFilters, b: CitizenDashboardFilters): boolean {
  return (
    a.scope_type === b.scope_type &&
    a.scope_id === b.scope_id &&
    a.fiscal_year === b.fiscal_year &&
    a.search.trim() === b.search.trim()
  );
}

function categoryCardClasses(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("general")) return "border-[#c6d9ee] bg-[#e8f1fb] text-[#0b5087]";
  if (normalized.includes("social")) return "border-[#bfe5cc] bg-[#e6f6ec] text-[#1f9f56]";
  if (normalized.includes("economic")) return "border-[#efe2a6] bg-[#fdf7df] text-[#d39d02]";
  return "border-[#d8dde5] bg-[#f3f5f8] text-[#6b7280]";
}

function categoryChartColor(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("general")) return "#0f5d8e";
  if (normalized.includes("social")) return "#22c55e";
  if (normalized.includes("economic")) return "#eab308";
  return "#6b7280";
}

function getScopeTypeLabel(scopeType: CitizenScopeType): string {
  return scopeType === "city" ? "City" : "Barangay";
}

function getStepTone(step: CitizenDashboardTransparencyStepVM): string {
  if (step.stepKey === "published") return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (step.state === "complete") return "border-[#b9d2e6] bg-[#edf5fd] text-[#0f5d8e]";
  return "border-slate-200 bg-slate-50 text-slate-500";
}

function getStepIcon(step: CitizenDashboardTransparencyStepVM) {
  if (step.stepKey === "published") return <ShieldCheck className="h-4 w-4" />;
  if (step.stepKey === "reviewed") return <Clock3 className="h-4 w-4" />;
  if (step.stepKey === "approved") return <FileText className="h-4 w-4" />;
  return <CalendarDays className="h-4 w-4" />;
}

function formatDaysSince(dateValue: string | null): string {
  if (!dateValue) return "N/A";
  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) return "N/A";
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)));
  return `${days} days`;
}

function getOrderedCategoryRows(categories: CitizenDashboardCategoryAllocationVM[]) {
  return CATEGORY_LAYOUT.map((label) => {
    const found = categories.find((item) => item.sectorLabel.toLowerCase() === label.toLowerCase());
    return {
      label,
      amount: found?.amount ?? 0,
      percent: found?.percent ?? 0,
      sectorCode: found?.sectorCode ?? "",
    };
  });
}

function DashboardLoading() {
  return (
    <div className="space-y-8 pb-10">
      <div className="h-[470px] animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-[440px] animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-[420px] animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-[360px] animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-[320px] animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}

export default function CitizenDashboardView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const repo = useMemo(() => getCitizenDashboardRepo(), []);
  const parsedFilters = useMemo(
    () => readFiltersFromUrl(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const [draftFilters, setDraftFilters] = useState<CitizenDashboardFilters>(parsedFilters);
  const [viewModel, setViewModel] = useState<CitizenDashboardVM | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraftFilters(parsedFilters);
  }, [parsedFilters]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await repo.getDashboard(parsedFilters);
        const mapped = mapCitizenDashboardToVM(data);
        if (!active) return;

        setViewModel(mapped);

        const normalized: CitizenDashboardFilters = {
          scope_type: data.resolvedFilters.scope_type,
          scope_id: data.resolvedFilters.scope_id,
          fiscal_year: mapped.controls.selectedFiscalYear,
          search: data.resolvedFilters.search,
        };
        setDraftFilters(normalized);

        if (!filtersEqual(parsedFilters, normalized)) {
          const params = filtersToParams(normalized);
          const query = params.toString();
          router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        }
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load dashboard.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [parsedFilters, pathname, repo, router]);

  const applyFilters = () => {
    const params = filtersToParams(draftFilters);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  if (isLoading && !viewModel) {
    return <DashboardLoading />;
  }

  if (error || !viewModel) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error ?? "Unable to load citizen dashboard."}
      </div>
    );
  }

  const aipParams = filtersToParams({
    scope_type: viewModel.controls.selectedScopeType,
    scope_id: viewModel.controls.selectedScopeId,
    fiscal_year: viewModel.controls.selectedFiscalYear,
    search: "",
  }).toString();

  const selectedScopeTypeLabel = getScopeTypeLabel(viewModel.controls.selectedScopeType);
  const categoryRows = getOrderedCategoryRows(viewModel.categoryAllocation);
  const latestPublishedAt = viewModel.aipStatusSummary.latestPublishedAt;

  const projectQuery = new URLSearchParams();
  projectQuery.set("scope_type", viewModel.controls.selectedScopeType);
  projectQuery.set("scope_id", viewModel.controls.selectedScopeId);
  projectQuery.set("fiscal_year", String(viewModel.controls.selectedFiscalYear));

  return (
    <section className="space-y-14 pb-12">
      <section className="relative">
        <div
          className={`relative overflow-hidden rounded-xl border border-slate-200 ${CITIZEN_DASHBOARD_TOKENS.heroGradientClass} px-6 pb-20 pt-10 text-white shadow-xl md:px-10 md:pb-24 md:pt-12`}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(255,255,255,0.15),transparent_45%)]" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(to_top,rgba(1,18,48,0.95),rgba(1,18,48,0.25),transparent)]" />
          </div>

          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="grid h-24 w-24 place-items-center rounded-full border border-white/40 bg-white/10 backdrop-blur-sm md:h-28 md:w-28">
              <Image src="/brand/logo3.svg" alt="OpenAIP emblem" width={70} height={70} className="h-16 w-16 md:h-[72px] md:w-[72px]" />
            </div>
            <h1 className="mt-5 text-6xl font-semibold leading-none tracking-tight md:text-8xl">
              Open<span className={CITIZEN_DASHBOARD_TOKENS.heroAccentTextClass}>AIP</span>
            </h1>
            <p className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">See Where Public Funds Go</p>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-slate-100 md:text-lg">
              Explore Annual Investment Programs (AIPs) of your city and barangay in a clear, easy-to-understand
              format. Track projects, budgets, and implementation status, empowering citizens with transparent access
              to local government investment plans.
            </p>
            <p className="mt-5 w-full text-left text-4xl font-semibold tracking-tight md:text-5xl">{viewModel.hero.scopeLabel}</p>
          </div>
        </div>
        <div className="absolute -bottom-8 left-1/2 z-20 w-full max-w-3xl -translate-x-1/2 px-4">
          <form
            className={`grid grid-cols-1 gap-2 rounded-full border border-slate-200 ${CITIZEN_DASHBOARD_TOKENS.searchPillSurfaceClass} p-2 shadow-lg md:grid-cols-[1fr_170px_auto]`}
            onSubmit={(event) => {
              event.preventDefault();
              applyFilters();
            }}
          >
            <Select
              value={`${draftFilters.scope_type}:${draftFilters.scope_id}`}
              onValueChange={(value) => {
                const [scopeType, scopeId] = value.split(":");
                setDraftFilters((prev) => ({
                  ...prev,
                  scope_type: parseScopeType(scopeType),
                  scope_id: scopeId ?? "",
                }));
              }}
            >
              <SelectTrigger className="h-10 rounded-full border-slate-200 bg-white text-xs md:text-sm">
                <SelectValue placeholder="Choose Place" />
              </SelectTrigger>
              <SelectContent>
                {viewModel.controls.locationOptions.map((option) => (
                  <SelectItem key={`${option.scope_type}:${option.value}`} value={`${option.scope_type}:${option.value}`}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <Select
                value={String(draftFilters.fiscal_year)}
                onValueChange={(value) => {
                  setDraftFilters((prev) => ({ ...prev, fiscal_year: parseFiscalYear(value) }));
                }}
              >
                <SelectTrigger className="h-10 rounded-full border-slate-200 bg-white text-xs md:text-sm">
                  <SelectValue placeholder="FY" />
                </SelectTrigger>
                <SelectContent>
                  {viewModel.controls.fiscalYearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      FY {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={draftFilters.search}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, search: event.target.value }))}
                placeholder="Search"
                className="h-10 rounded-full border-slate-200 bg-white text-xs md:text-sm"
              />
            </div>

            <Button type="submit" className={`h-10 rounded-full px-6 ${CITIZEN_DASHBOARD_TOKENS.primaryButtonClass}`}>
              <Search className="mr-1 h-4 w-4" />
              Search
            </Button>
          </form>
        </div>
      </section>

      <div className="space-y-1 pt-3 text-center">
        <p className="text-sm text-[#0f5f90]">See how your city prioritizes infrastructure, healthcare, and services.</p>
        <p className="text-xs text-[#7ca3bd]">Scroll to explore</p>
      </div>

      <section className="space-y-6 px-2 md:px-6">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[#0b5188] md:text-5xl">
            {viewModel.hero.scopeLabel} Budget Allocation Breakdown (FY {viewModel.budgetSummary.fiscalYear})
          </h2>
          <p className="text-base text-slate-500">Total budget and allocation by category for FY {viewModel.budgetSummary.fiscalYear}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[40%_60%]">
          <Card className="overflow-hidden border-0 bg-gradient-to-b from-[#0f5d8e] to-[#0a3f63] text-white shadow-xl">
            <CardContent className="space-y-5 p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-xl font-semibold">$</div>
              <div>
                <p className="text-sm text-slate-100">Total Budget (FY {viewModel.budgetSummary.fiscalYear})</p>
                <p className="mt-2 text-5xl font-semibold">{formatPeso(viewModel.budgetSummary.totalBudget)}</p>
                <p className="mt-2 text-sm text-slate-100">From the published AIP record</p>
              </div>
              <Button asChild className="w-full rounded-xl bg-white text-[#0b5087] hover:bg-slate-100">
                <Link href="/budget-allocation">View Full Budget Allocation</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {categoryRows.map((item) => (
              <Card key={item.label} className={`border shadow-sm ${categoryCardClasses(item.label)}`}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <Badge variant="outline" className="rounded-full border-none bg-white/75 text-xs">
                      {item.percent.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-4xl font-semibold">{formatPeso(item.amount)}</p>
                  <Button
                    asChild
                    variant="ghost"
                    className="h-8 px-0 text-xs font-medium text-inherit hover:bg-transparent hover:underline"
                    disabled={!item.sectorCode}
                  >
                    <Link
                      href={
                        item.sectorCode
                          ? `/projects?${new URLSearchParams({ ...Object.fromEntries(projectQuery), sector_code: item.sectorCode }).toString()}`
                          : `/projects?${projectQuery.toString()}`
                      }
                    >
                      View Projects <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-slate-800">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-[#0f5d8e]">
                <Landmark className="h-4 w-4" />
              </span>
              Allocation by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartCard
              title="Allocation by Category"
              className="border-0 py-0 shadow-none [&_[data-slot=card-header]]:hidden [&_[data-slot=card-content]]:px-0"
              series={{
                data: viewModel.categoryAllocation.map((item) => ({
                  sector: item.sectorLabel.replace(" Services", ""),
                  amount: item.amount,
                })),
                xKey: "sector",
                bars: [{ key: "amount", label: "Budget", fill: "#0f5d8e" }],
              }}
              showLegend={false}
              showGrid
              height={290}
              emptyText="No category allocation yet."
              formatTooltipValue={(value) => formatPeso(Number(value))}
              formatYAxis={(value) => formatPeso(Number(value))}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {categoryRows.map((item) => (
                <div key={item.label} className="inline-flex items-center gap-2 text-xs text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryChartColor(item.label) }} />
                  {item.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="space-y-6 px-2 md:px-6">
        <div className="space-y-2 text-center">
          <h2 className="text-4xl font-semibold text-[#0b5188]">Top Funded Project Highlights</h2>
          <p className="text-base text-slate-500">Featured health and infrastructure projects with highest allocations</p>
        </div>

        {viewModel.highlightProjects.length === 0 ? (
          <Card className="border-dashed border-slate-300">
            <CardContent className="p-6 text-sm text-slate-500">No highlight projects available.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {viewModel.highlightProjects.slice(0, 2).map((project) => {
              const isHealth = project.projectType === "health";
              return (
                <Card key={project.projectId} className="overflow-hidden border-slate-200">
                  <div
                    className={
                      isHealth
                        ? "relative h-52 bg-gradient-to-b from-[#f5e6ef] via-[#d6c6ce] to-[#8d8085]"
                        : "relative h-52 bg-gradient-to-b from-[#dce9f4] via-[#a3b5bf] to-[#57656d]"
                    }
                  >
                    <div className="absolute left-4 top-4">
                      <Badge className={isHealth ? "bg-pink-600 text-white" : "bg-blue-600 text-white"}>{project.sectorLabel}</Badge>
                    </div>
                    <div className="absolute right-4 top-4">
                      <Badge variant="outline" className="rounded-full border-none bg-white px-3 py-1 text-base font-semibold text-[#0b5188]">
                        {formatPeso(project.budget)}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 grid place-items-center text-white/35">
                      {isHealth ? <Heart className="h-16 w-16" /> : <Building2 className="h-16 w-16" />}
                    </div>
                  </div>
                  <CardContent className="space-y-3 p-5">
                    <h3 className="text-3xl font-semibold tracking-tight text-slate-900">{project.title}</h3>
                    <p className="text-sm text-slate-600">
                      {project.scopeName} - FY {project.fiscalYear}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500">Source: Published AIP</p>
                      <Button asChild className={isHealth ? "bg-pink-600 hover:bg-pink-700" : "bg-blue-600 hover:bg-blue-700"}>
                        <Link href={project.href}>
                          Explore {isHealth ? "Health" : "Infrastructure"} Projects
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-3xl font-semibold text-slate-900">Top Funded Projects</h3>
          {viewModel.topProjects.length === 0 ? (
            <Card className="border-dashed border-slate-300">
              <CardContent className="p-6 text-sm text-slate-500">No projects match current filters.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {viewModel.topProjects.slice(0, 6).map((project) => (
                <Card key={project.projectId} className="border-slate-200">
                  <CardContent className="space-y-3 p-4">
                    <div className="grid h-28 place-items-center rounded-xl bg-slate-100 text-slate-300">
                      {project.projectType === "health" ? <Heart className="h-10 w-10" /> : <Building2 className="h-10 w-10" />}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="line-clamp-2 text-sm font-semibold text-slate-900">{project.title}</h4>
                        <Badge variant="outline" className="capitalize">
                          {project.projectType}
                        </Badge>
                      </div>
                      <p className="text-3xl font-semibold text-[#0b5188]">{formatPeso(project.budget)}</p>
                    </div>
                    <Button asChild variant="outline" className="w-full border-[#0b5188] text-[#0b5188] hover:bg-[#0b5188] hover:text-white">
                      <Link href={project.href}>View Project</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-8 px-2 md:px-6">
        <Card className="border-slate-200 shadow-lg">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-b from-[#3292cf] to-[#0f5d8e] text-white shadow-md">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-4xl font-semibold tracking-tight text-[#0b5188] md:text-5xl">{viewModel.hero.scopeLabel}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className="bg-[#0f5d8e]">{selectedScopeTypeLabel}</Badge>
                    <Badge variant="outline">FY {viewModel.controls.selectedFiscalYear}</Badge>
                  </div>
                </div>
              </div>
              <div className="rounded-md border-l-4 border-[#0f5d8e] bg-[#eaf1f9] p-4 text-sm text-slate-700">
                <p className="font-semibold text-[#0b5188]">Data shown reflects published AIP records for the selected year.</p>
                <p className="mt-1">Information is updated as new documents are processed and published by the responsible offices.</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-2xl font-semibold text-slate-900">Status at a Glance</h4>
              <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs text-slate-600">Current Status</p>
                <Badge className="bg-emerald-600">Published</Badge>
              </div>
              <div className="space-y-1 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs text-slate-600">Publication Date</p>
                <p className="text-sm font-semibold text-slate-900">{latestPublishedAt ? formatDate(latestPublishedAt) : "No published AIP yet"}</p>
              </div>
              <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-600">Last Updated</p>
                <p className="text-sm font-semibold text-slate-900">{latestPublishedAt ? formatDate(latestPublishedAt) : "No update yet"}</p>
              </div>
              <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-600">Duration in Current Stage</p>
                <p className="text-sm font-semibold text-slate-900">Published - {formatDaysSince(latestPublishedAt)}</p>
              </div>
              <Button asChild className="w-full rounded-xl bg-[#0b5188] hover:bg-[#0a416d]">
                <Link href={aipParams ? `/aips?${aipParams}` : "/aips"}>
                  <FileText className="mr-2 h-4 w-4" />
                  View AIP
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <div className="space-y-2 text-center">
            <h2 className="text-4xl font-semibold text-[#0b5188]">Transparency Journey</h2>
            <p className="text-base text-slate-500">Track the progress of AIP submissions through each stage of the review process</p>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            {viewModel.transparencyJourney.map((step, index) => (
              <Card key={step.stepKey} className={`relative text-center shadow-sm ${getStepTone(step)}`}>
                {index < viewModel.transparencyJourney.length - 1 ? (
                  <div className="pointer-events-none absolute right-[-24px] top-10 hidden h-0.5 w-11 bg-[#b5cde0] md:block" />
                ) : null}
                <CardContent className="space-y-2 p-3">
                  <div className="mx-auto grid h-7 w-7 place-items-center rounded-full border border-slate-300 bg-white text-[11px] font-semibold text-slate-500">
                    {index + 1}
                  </div>
                  <div className="mx-auto grid h-8 w-8 place-items-center rounded-md bg-white/70">{getStepIcon(step)}</div>
                  <p className="text-lg font-semibold text-slate-900">{step.label}</p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                  <Badge variant="outline">{step.count} LGUs</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mx-auto max-w-2xl rounded-md border-l-4 border-[#0f5d8e] bg-[#edf4fb] p-3 text-sm text-slate-700">
            <span className="font-semibold text-[#0b5188]">Note:</span> Only <span className="font-semibold text-emerald-700">Published</span> AIPs allow document viewing and full budget details.
          </div>
        </div>
      </section>

      <section className="space-y-8 px-2 md:px-6">
        <div className="space-y-2 text-center">
          <h2 className="text-4xl font-semibold text-[#0b5188]">LGU Status Board</h2>
          <p className="text-base text-slate-500">Track publication status across all LGUs for FY {viewModel.controls.selectedFiscalYear}</p>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-lg">
          <Table>
            <TableHeader className="bg-[#0f5d8e]">
              <TableRow>
                <TableHead className="text-white">LGU Name</TableHead>
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Duration</TableHead>
                <TableHead className="text-white">Last Updated</TableHead>
                <TableHead className="text-white">Publication Date</TableHead>
                <TableHead className="text-right text-white">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewModel.lguStatusBoard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-slate-500">No published LGU entries for this filter.</TableCell>
                </TableRow>
              ) : (
                viewModel.lguStatusBoard.map((row) => (
                  <TableRow key={row.aipId}>
                    <TableCell className="font-medium text-slate-900">{row.lguName}</TableCell>
                    <TableCell>{row.lguType}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-700">{row.statusLabel}</Badge>
                    </TableCell>
                    <TableCell>{formatDaysSince(row.publishedDate)}</TableCell>
                    <TableCell>{row.publishedDate ? formatDate(row.publishedDate) : "-"}</TableCell>
                    <TableCell>{row.publishedDate ? formatDate(row.publishedDate) : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" className="bg-[#0b5188] hover:bg-[#0a416d]">
                        <Link href={row.href}>View AIP</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="space-y-3 text-center">
          <h2 className="text-4xl font-semibold text-[#0b5188]">Recently Published AIPs</h2>
          <p className="text-base text-slate-500">Latest published Annual Investment Plans for FY {viewModel.controls.selectedFiscalYear}</p>
        </div>

        {viewModel.recentlyPublishedAips.length === 0 ? (
          <Card className="border-dashed border-slate-300">
            <CardContent className="p-6 text-center text-sm text-slate-500">No recent published AIPs.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {viewModel.recentlyPublishedAips.map((item) => (
              <Card key={item.aipId} className="border-slate-200">
                <CardContent className="space-y-3 p-4 text-left">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-md bg-emerald-100 text-emerald-700">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.scopeName}</p>
                      <p className="text-xs capitalize text-slate-500">{item.scopeType}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    <CalendarDays className="mr-1 inline h-3 w-3" />
                    Published: {item.publishedDate ? formatDate(item.publishedDate) : "N/A"}
                  </p>
                  <p className="text-xs text-slate-500">
                    <Clock3 className="mr-1 inline h-3 w-3" />
                    FY {item.fiscalYear}
                  </p>
                  <Button asChild className="w-full bg-[#0da548] hover:bg-[#0b8a3d]">
                    <Link href={item.href}>View AIP</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
