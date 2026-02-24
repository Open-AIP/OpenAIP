"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CitizenSectionBanner from "@/features/citizen/components/CitizenSectionBanner";
import HealthProjectCard from "@/features/projects/health/components/health-project-card";
import type { HealthProject } from "@/lib/repos/projects/types";
import {
  filterProjectsByScopeOption,
  filterProjectsByYearAndQuery,
  getProjectYearsDescending,
  prefixProjectTitles,
} from "@/lib/selectors/projects/project-list";
import ProjectFilters from "../components/project-filters";

type HealthProjectsViewProps = {
  projects: HealthProject[];
  lguLabel: string;
  lguOptions: string[];
};

export default function HealthProjectsView({
  projects,
  lguLabel,
  lguOptions,
}: HealthProjectsViewProps) {
  const years = useMemo(() => getProjectYearsDescending(projects), [projects]);

  const [yearFilter, setYearFilter] = useState<string>(String(years[0] ?? "all"));
  const [scopeFilter, setScopeFilter] = useState<string>("All LGUs");
  const [query, setQuery] = useState<string>("");

  const displayProjects = useMemo(
    () => prefixProjectTitles(projects, lguLabel),
    [projects, lguLabel]
  );

  const filteredProjects = useMemo(() => {
    const scopedProjects = filterProjectsByScopeOption(displayProjects, scopeFilter, lguLabel);
    return filterProjectsByYearAndQuery(scopedProjects, { yearFilter, query });
  }, [displayProjects, scopeFilter, lguLabel, yearFilter, query]);

  return (
    <section className="space-y-6">
      <CitizenSectionBanner
        title="Health Projects"
        description="View projects focused on public health, including medical services, health facilities, and community wellness programs."
        align="center"
        imageSrc="/mock/health/health2.jpg"
        eyebrow="OpenAIP"
      />

      <Card className="border-slate-200">
        <CardContent className="space-y-2 p-5">
          <div className="text-sm font-semibold text-slate-900">What are Health Projects?</div>
          <p className="text-sm text-slate-600">
            Health projects are initiatives funded by local government to improve healthcare
            access, preventive programs, and public wellness services.
          </p>
        </CardContent>
      </Card>

      <ProjectFilters
        fiscalYears={years}
        fiscalYearFilter={yearFilter}
        onFiscalYearChange={setYearFilter}
        scopeOptions={lguOptions}
        scopeFilter={scopeFilter}
        onScopeChange={setScopeFilter}
        query={query}
        onQueryChange={setQuery}
      />

      <p className="text-xs text-slate-500">
        Showing {filteredProjects.length} result{filteredProjects.length !== 1 ? "s" : ""}
      </p>

      <div className="space-y-5">
        {filteredProjects.map((project) => (
          <HealthProjectCard
            key={project.id}
            project={project}
            actionSlot={
              <Button className="bg-[#022437] hover:bg-[#022437]/90 text-white" asChild>
                <Link href={`/projects/health/${project.id}`}>View Details</Link>
              </Button>
            }
          />
        ))}
      </div>
    </section>
  );
}

