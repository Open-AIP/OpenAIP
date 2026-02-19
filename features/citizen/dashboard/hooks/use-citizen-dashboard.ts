"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { mapCitizenDashboardToVM } from "@/lib/mappers/dashboard/citizen";
import { getCitizenDashboardRepo } from "@/lib/repos/citizen-dashboard";
import type { CitizenDashboardFilters } from "@/lib/repos/citizen-dashboard";
import type {
  CitizenDashboardHighlightProjectVM,
  CitizenDashboardVM,
} from "@/lib/types/viewmodels/dashboard";
import {
  filtersEqual,
  filtersToParams,
  getOrderedCategoryRows,
  getScopeTypeLabel,
  readFiltersFromUrl,
} from "../utils";

export function useCitizenDashboard() {
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

  const aipParams = useMemo(() => {
    if (!viewModel) return "";
    return filtersToParams({
      scope_type: viewModel.controls.selectedScopeType,
      scope_id: viewModel.controls.selectedScopeId,
      fiscal_year: viewModel.controls.selectedFiscalYear,
      search: "",
    }).toString();
  }, [viewModel]);

  const selectedScopeTypeLabel = useMemo(
    () => getScopeTypeLabel(viewModel?.controls.selectedScopeType ?? "city"),
    [viewModel]
  );

  const categoryRows = useMemo(() => {
    if (!viewModel) return [];
    return getOrderedCategoryRows(viewModel.categoryAllocation);
  }, [viewModel]);

  const latestPublishedAt = viewModel?.aipStatusSummary.latestPublishedAt ?? null;

  const projectQueryString = useMemo(() => {
    if (!viewModel) return "";

    return new URLSearchParams({
      scope_type: viewModel.controls.selectedScopeType,
      scope_id: viewModel.controls.selectedScopeId,
      fiscal_year: String(viewModel.controls.selectedFiscalYear),
    }).toString();
  }, [viewModel]);

  const highlightProjectsByType = useMemo(() => {
    if (!viewModel) return [];

    const makeHighlight = (
      project: (typeof viewModel.topProjects)[number]
    ): CitizenDashboardHighlightProjectVM => ({
      projectId: project.projectId,
      title: project.title,
      projectType: project.projectType,
      sectorLabel: project.sectorLabel,
      budget: project.budget,
      scopeName: viewModel.hero.scopeLabel,
      fiscalYear: viewModel.controls.selectedFiscalYear,
      publishedAt: project.publishedAt,
      imageUrl: "/default/default-no-image.jpg",
      href: project.href,
    });

    const healthProject = viewModel.topProjects.find((project) => project.projectType === "health");
    const infrastructureProject = viewModel.topProjects.find(
      (project) => project.projectType === "infrastructure"
    );

    const selected: CitizenDashboardHighlightProjectVM[] = [];
    if (healthProject) selected.push(makeHighlight(healthProject));
    if (infrastructureProject) selected.push(makeHighlight(infrastructureProject));

    return selected.length > 0 ? selected : viewModel.highlightProjects;
  }, [viewModel]);

  return {
    draftFilters,
    setDraftFilters,
    viewModel,
    isLoading,
    error,
    applyFilters,
    aipParams,
    selectedScopeTypeLabel,
    categoryRows,
    latestPublishedAt,
    projectQueryString,
    highlightProjectsByType,
  };
}
