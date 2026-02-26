type ProjectListRow = {
  year: number;
  title: string;
  description?: string | null;
  implementingOffice?: string | null;
  contractorName?: string | null;
  fundingSource?: string | null;
};

type FilterByYearAndQueryInput = {
  yearFilter: string;
  query: string;
};

const DEFAULT_SCOPE_OPTION = "All LGUs";

function includesQuery(value: string | null | undefined, query: string): boolean {
  if (!query) return true;
  if (!value) return false;
  return value.toLowerCase().includes(query);
}

export function getProjectYearsDescending<T extends ProjectListRow>(projects: T[]): number[] {
  return Array.from(new Set(projects.map((project) => project.year))).sort((a, b) => b - a);
}

export function prefixProjectTitles<T extends ProjectListRow>(projects: T[], prefix: string): T[] {
  return projects.map((project) => ({
    ...project,
    title: `${prefix} - ${project.title}`,
  }));
}

export function filterProjectsByScopeOption<T>(
  projects: T[],
  scopeFilter: string,
  allowedScopeLabel: string
): T[] {
  if (scopeFilter === DEFAULT_SCOPE_OPTION || scopeFilter === allowedScopeLabel) {
    return projects;
  }
  return [];
}

export function filterProjectsByYearAndQuery<T extends ProjectListRow>(
  projects: T[],
  input: FilterByYearAndQueryInput
): T[] {
  const normalizedYear = input.yearFilter.trim().toLowerCase();
  const normalizedQuery = input.query.trim().toLowerCase();

  return projects.filter((project) => {
    const yearOk = normalizedYear === "all" ? true : project.year === Number(input.yearFilter);
    const queryOk =
      !normalizedQuery ||
      includesQuery(project.title, normalizedQuery) ||
      includesQuery(project.description, normalizedQuery) ||
      includesQuery(project.implementingOffice, normalizedQuery) ||
      includesQuery(project.contractorName, normalizedQuery) ||
      includesQuery(project.fundingSource, normalizedQuery);

    return yearOk && queryOk;
  });
}

