import type { AipReviewRow, AipRow, BarangayRow, ProjectRow } from "@/lib/contracts/databasev2";
import type { CitizenDashboardData } from "@/lib/repos/citizen-dashboard/types";
import type {
  CitizenDashboardCategoryAllocationVM,
  CitizenDashboardLguStatusRowVM,
  CitizenDashboardProjectCardVM,
  CitizenDashboardTransparencyStepVM,
  CitizenDashboardVM,
} from "@/lib/types/viewmodels/dashboard";

function toTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const stamp = new Date(value).getTime();
  return Number.isNaN(stamp) ? 0 : stamp;
}

function coerceNumeric(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function buildScopeLabel(
  scopeType: "city" | "barangay",
  scopeId: string,
  citiesById: Map<string, string>,
  barangaysById: Map<string, string>
): string {
  if (scopeType === "city") {
    return citiesById.get(scopeId) ?? "Selected City";
  }

  const barangayName = barangaysById.get(scopeId);
  return barangayName ? `Brgy. ${barangayName}` : "Selected Barangay";
}

function aipInScope(
  aip: AipRow,
  scopeType: "city" | "barangay",
  scopeId: string,
  barangayById: Map<string, BarangayRow>
): boolean {
  if (scopeType === "barangay") {
    return aip.barangay_id === scopeId;
  }

  if (aip.city_id === scopeId) {
    return true;
  }

  if (!aip.barangay_id) {
    return false;
  }

  return barangayById.get(aip.barangay_id)?.city_id === scopeId;
}

function getSectorColorToken(code: string): string {
  if (code === "1000") return "text-teal-700";
  if (code === "3000") return "text-blue-500";
  if (code === "8000") return "text-emerald-500";
  return "text-amber-500";
}

function projectHref(project: ProjectRow): string {
  if (project.category === "health") return `/projects/health/${project.id}`;
  if (project.category === "infrastructure") return `/projects/infrastructure/${project.id}`;
  return "/projects";
}

function scopeHref(scopeType: "city" | "barangay", scopeId: string, fiscalYear: number): string {
  const params = new URLSearchParams();
  params.set("scope_type", scopeType);
  params.set("scope_id", scopeId);
  params.set("fiscal_year", String(fiscalYear));
  return `/aips?${params.toString()}`;
}

function lastEventAtForStep(stepKey: CitizenDashboardTransparencyStepVM["stepKey"], aips: AipRow[], reviews: AipReviewRow[]): string | null {
  if (stepKey === "prepared") {
    return aips
      .map((aip) => aip.created_at)
      .sort((a, b) => toTimestamp(b) - toTimestamp(a))[0] ?? null;
  }

  if (stepKey === "submitted") {
    return aips
      .map((aip) => aip.submitted_at)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => toTimestamp(b) - toTimestamp(a))[0] ?? null;
  }

  if (stepKey === "reviewed" || stepKey === "approved") {
    return reviews
      .map((review) => review.created_at)
      .sort((a, b) => toTimestamp(b) - toTimestamp(a))[0] ?? null;
  }

  return aips
    .map((aip) => aip.published_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => toTimestamp(b) - toTimestamp(a))[0] ?? null;
}

export function mapCitizenDashboardToVM(data: CitizenDashboardData): CitizenDashboardVM {
  const { resolvedFilters } = data;
  const citiesById = new Map(data.activeCities.map((city) => [city.id, city.name]));
  const barangayById = new Map(data.activeBarangays.map((barangay) => [barangay.id, barangay]));
  const barangayNameById = new Map(data.activeBarangays.map((barangay) => [barangay.id, barangay.name]));
  const sectorLabelByCode = new Map(data.sectors.map((sector) => [sector.code, sector.label]));

  const scopePublishedAips = data.publishedAips.filter((aip) =>
    aipInScope(aip, resolvedFilters.scope_type, resolvedFilters.scope_id, barangayById)
  );

  const fiscalYearOptions = Array.from(new Set(scopePublishedAips.map((aip) => aip.fiscal_year))).sort(
    (a, b) => b - a
  );
  const selectedFiscalYear = fiscalYearOptions.includes(resolvedFilters.fiscal_year)
    ? resolvedFilters.fiscal_year
    : fiscalYearOptions[0] ?? resolvedFilters.fiscal_year;

  const yearAips = scopePublishedAips.filter((aip) => aip.fiscal_year === selectedFiscalYear);
  const yearAipIds = new Set(yearAips.map((aip) => aip.id));

  const yearProjects = data.projects.filter((project) => yearAipIds.has(project.aip_id));
  const yearReviews = data.aipReviews.filter((review) => yearAipIds.has(review.aip_id));

  const query = resolvedFilters.search.trim().toLowerCase();

  const matchingProjects = yearProjects.filter((project) => {
    if (!query) return true;
    const sectorLabel = sectorLabelByCode.get(project.sector_code) ?? project.sector_code;
    return (
      project.program_project_description.toLowerCase().includes(query) ||
      sectorLabel.toLowerCase().includes(query)
    );
  });

  const totalBudget = yearProjects.reduce((sum, project) => sum + coerceNumeric(project.total), 0);
  const healthTotal = yearProjects
    .filter((project) => project.category === "health")
    .reduce((sum, project) => sum + coerceNumeric(project.total), 0);
  const infrastructureTotal = yearProjects
    .filter((project) => project.category === "infrastructure")
    .reduce((sum, project) => sum + coerceNumeric(project.total), 0);
  const otherTotal = yearProjects
    .filter((project) => project.category === "other")
    .reduce((sum, project) => sum + coerceNumeric(project.total), 0);

  const groupedBySector = new Map<string, { amount: number; count: number }>();
  for (const project of yearProjects) {
    const current = groupedBySector.get(project.sector_code) ?? { amount: 0, count: 0 };
    current.amount += coerceNumeric(project.total);
    current.count += 1;
    groupedBySector.set(project.sector_code, current);
  }

  const categoryAllocation: CitizenDashboardCategoryAllocationVM[] = [...groupedBySector.entries()]
    .map(([sectorCode, stats]) => ({
      sectorCode,
      sectorLabel: sectorLabelByCode.get(sectorCode) ?? `Sector ${sectorCode}`,
      amount: stats.amount,
      percent: totalBudget > 0 ? Math.round((stats.amount / totalBudget) * 100) : 0,
      projectCount: stats.count,
      colorToken: getSectorColorToken(sectorCode),
    }))
    .sort((a, b) => b.amount - a.amount);

  const sortedProjects = [...matchingProjects].sort(
    (a, b) =>
      coerceNumeric(b.total) - coerceNumeric(a.total) ||
      toTimestamp(b.created_at) - toTimestamp(a.created_at)
  );

  const statusByAipId = new Map(data.publicStatusRows.map((row) => [row.id, row]));

  const topProjects: CitizenDashboardProjectCardVM[] = sortedProjects.slice(0, 8).map((project, index) => ({
    projectId: project.id,
    rank: index + 1,
    title: project.program_project_description || "Untitled Project",
    projectType: project.category,
    sectorLabel: sectorLabelByCode.get(project.sector_code) ?? project.sector_code,
    budget: coerceNumeric(project.total),
    publishedAt: statusByAipId.get(project.aip_id)?.published_at ?? null,
    statusLabel: "Published",
    href: projectHref(project),
  }));

  const highlightProjects = topProjects.slice(0, 2).map((project) => ({
    projectId: project.projectId,
    title: project.title,
    projectType: project.projectType,
    sectorLabel: project.sectorLabel,
    budget: project.budget,
    scopeName: statusByAipId.get(
      yearProjects.find((row) => row.id === project.projectId)?.aip_id ?? ""
    )?.scope_name ?? buildScopeLabel(resolvedFilters.scope_type, resolvedFilters.scope_id, citiesById, barangayNameById),
    fiscalYear: selectedFiscalYear,
    publishedAt: project.publishedAt,
    imageUrl: "/default/default-no-image.jpg",
    href: project.href,
  }));

  const transparencyJourney: CitizenDashboardTransparencyStepVM[] = [
    {
      stepKey: "prepared",
      label: "Prepared",
      description: "AIPs drafted by LGUs",
      count: yearAips.length,
      lastEventAt: lastEventAtForStep("prepared", yearAips, yearReviews),
      state: yearAips.length > 0 ? "complete" : "pending",
    },
    {
      stepKey: "submitted",
      label: "Submitted",
      description: "AIPs submitted for review",
      count: yearAips.filter((aip) => Boolean(aip.submitted_at)).length,
      lastEventAt: lastEventAtForStep("submitted", yearAips, yearReviews),
      state: yearAips.some((aip) => Boolean(aip.submitted_at)) ? "complete" : "pending",
    },
    {
      stepKey: "reviewed",
      label: "Reviewed",
      description: "AIPs reviewed by assigned reviewers",
      count: new Set(yearReviews.map((review) => review.aip_id)).size,
      lastEventAt: lastEventAtForStep("reviewed", yearAips, yearReviews),
      state: yearReviews.length > 0 ? "complete" : "pending",
    },
    {
      stepKey: "approved",
      label: "Approved",
      description: "AIPs approved for publication",
      count: new Set(
        yearReviews.filter((review) => review.action === "approve").map((review) => review.aip_id)
      ).size,
      lastEventAt: lastEventAtForStep("approved", yearAips, yearReviews),
      state: yearReviews.some((review) => review.action === "approve") ? "complete" : "pending",
    },
    {
      stepKey: "published",
      label: "Published",
      description: "Publicly visible AIPs",
      count: yearAips.length,
      lastEventAt: lastEventAtForStep("published", yearAips, yearReviews),
      state: yearAips.length > 0 ? "complete" : "pending",
    },
  ];

  const yearStatusRows = data.publicStatusRows.filter((row) => {
    if (row.fiscal_year !== selectedFiscalYear) return false;
    if (resolvedFilters.scope_type === "barangay") {
      return row.scope_type === "barangay" && row.barangay_id === resolvedFilters.scope_id;
    }

    if (row.scope_type === "city" && row.city_id === resolvedFilters.scope_id) {
      return true;
    }

    if (row.scope_type !== "barangay" || !row.barangay_id) {
      return false;
    }

    return barangayById.get(row.barangay_id)?.city_id === resolvedFilters.scope_id;
  });

  const statsByAipId = new Map<string, { projectCount: number; totalBudget: number }>();
  for (const project of yearProjects) {
    const current = statsByAipId.get(project.aip_id) ?? { projectCount: 0, totalBudget: 0 };
    current.projectCount += 1;
    current.totalBudget += coerceNumeric(project.total);
    statsByAipId.set(project.aip_id, current);
  }

  const lguStatusBoard: CitizenDashboardLguStatusRowVM[] = [...yearStatusRows]
    .sort((a, b) => toTimestamp(b.published_at) - toTimestamp(a.published_at))
    .map((row) => {
      const scopeId = row.scope_type === "city" ? row.city_id : row.barangay_id;
      const stats = statsByAipId.get(row.id) ?? { projectCount: 0, totalBudget: 0 };
      return {
        aipId: row.id,
        lguName: row.scope_name,
        lguType: row.scope_type === "city" ? "City" : "Barangay",
        fiscalYear: row.fiscal_year,
        publishedDate: row.published_at,
        projectCount: stats.projectCount,
        totalBudget: stats.totalBudget,
        statusLabel: "Published",
        href: scopeHref(row.scope_type, scopeId ?? "", row.fiscal_year),
      };
    });

  const recentPublishedRows = data.publicStatusRows
    .filter((row) => {
      if (resolvedFilters.scope_type === "barangay") {
        return row.scope_type === "barangay" && row.barangay_id === resolvedFilters.scope_id;
      }

      if (row.scope_type === "city" && row.city_id === resolvedFilters.scope_id) return true;
      if (row.scope_type !== "barangay" || !row.barangay_id) return false;
      return barangayById.get(row.barangay_id)?.city_id === resolvedFilters.scope_id;
    })
    .sort((a, b) => toTimestamp(b.published_at) - toTimestamp(a.published_at))
    .slice(0, 4);

  const fileByAipId = new Map(data.uploadedFiles.map((file) => [file.aip_id, file]));
  const statsForAllByAipId = new Map<string, { projectCount: number; totalBudget: number }>();
  for (const project of data.projects) {
    const current = statsForAllByAipId.get(project.aip_id) ?? { projectCount: 0, totalBudget: 0 };
    current.projectCount += 1;
    current.totalBudget += coerceNumeric(project.total);
    statsForAllByAipId.set(project.aip_id, current);
  }

  const recentlyPublishedAips = recentPublishedRows.map((row) => {
    const scopeId = row.scope_type === "city" ? row.city_id : row.barangay_id;
    const file = fileByAipId.get(row.id);
    const stats = statsForAllByAipId.get(row.id) ?? { projectCount: 0, totalBudget: 0 };
    return {
      aipId: row.id,
      title: `${row.scope_name} AIP ${row.fiscal_year}`,
      scopeName: row.scope_name,
      scopeType: row.scope_type,
      fiscalYear: row.fiscal_year,
      publishedDate: row.published_at,
      fileName: file?.original_file_name ?? "Published AIP.pdf",
      totalBudget: stats.totalBudget,
      href: scopeHref(row.scope_type, scopeId ?? "", row.fiscal_year),
    };
  });

  const locationOptions = [
    ...data.activeCities.map((city) => ({
      value: city.id,
      label: city.name,
      scope_type: "city" as const,
    })),
    ...data.activeBarangays.map((barangay) => ({
      value: barangay.id,
      label: `Brgy. ${barangay.name}`,
      scope_type: "barangay" as const,
    })),
  ];

  const scopeLabel = buildScopeLabel(
    resolvedFilters.scope_type,
    resolvedFilters.scope_id,
    citiesById,
    barangayNameById
  );

  const latestPublishedAt = yearAips
    .map((aip) => aip.published_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => toTimestamp(b) - toTimestamp(a))[0] ?? null;

  return {
    hero: {
      title: "OpenAIP",
      scopeLabel,
      subtitle: "See where public funds go through published Annual Investment Programs.",
    },
    controls: {
      locationOptions,
      selectedScopeType: resolvedFilters.scope_type,
      selectedScopeId: resolvedFilters.scope_id,
      fiscalYearOptions,
      selectedFiscalYear,
      search: resolvedFilters.search,
    },
    budgetSummary: {
      fiscalYear: selectedFiscalYear,
      scopeLabel,
      totalBudget,
      totalProjects: yearProjects.length,
      healthTotal,
      infrastructureTotal,
      otherTotal,
      lastPublishedAt: latestPublishedAt,
    },
    categoryAllocation,
    highlightProjects,
    topProjects,
    aipStatusSummary: {
      publishedCount: yearAips.length,
      latestPublishedAt,
      totalPublishedBudget: totalBudget,
      totalPublishedProjects: yearProjects.length,
      statusBadge: yearAips.length > 0 ? "published" : "empty",
    },
    transparencyJourney,
    lguStatusBoard,
    recentlyPublishedAips,
  };
}

