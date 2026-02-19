"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import HealthProjectCard from "@/features/projects/health/components/health-project-card";
import type { HealthProject } from "@/lib/repos/projects/types";
import CitizenSectionBanner from "@/features/citizen/components/CitizenSectionBanner";
import ProjectFilters from "@/features/citizen/projects/components/project-filters";
import { Card, CardContent } from "@/components/ui/card";
import {
  filterProjectsByScopeOption,
  filterProjectsByYearAndQuery,
  getProjectYearsDescending,
  prefixProjectTitles,
} from "@/lib/selectors/projects/project-list";

type Props = {
  projects: HealthProject[];
  lguLabel: string;
  lguOptions: string[];
};

export default function CitizenHealthProjectsView({
  projects,
  lguLabel,
  lguOptions,
}: Props) {
  const years = useMemo(() => getProjectYearsDescending(projects), [projects]);

  const [fiscalYearFilter, setFiscalYearFilter] = useState<string>(String(years[0] ?? "all"));
  const [scopeFilter, setScopeFilter] = useState<string>(lguOptions[1] ?? "All LGUs");
  const [query, setQuery] = useState<string>("");

  const displayProjects = useMemo(
    () => prefixProjectTitles(projects, lguLabel),
    [projects, lguLabel]
  );

  const filteredProjects = useMemo(() => {
    const scopedProjects = filterProjectsByScopeOption(
      displayProjects,
      scopeFilter,
      lguLabel
    );
    return filterProjectsByYearAndQuery(scopedProjects, {
      yearFilter: fiscalYearFilter,
      query,
    });
  }, [displayProjects, fiscalYearFilter, scopeFilter, query, lguLabel]);

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
          <div className="text-sm font-semibold text-slate-900">
            What are Health Projects?
          </div>
          <p className="text-sm text-slate-600">
            Health projects are initiatives funded by the local government to protect and
            improve public health. These include medical services, health facilities, disease
            prevention programs, and community wellness activities.
          </p>
        </CardContent>
      </Card>

      <ProjectFilters
        fiscalYears={years}
        fiscalYearFilter={fiscalYearFilter}
        onFiscalYearChange={setFiscalYearFilter}
        scopeOptions={lguOptions}
        scopeFilter={scopeFilter}
        onScopeChange={setScopeFilter}
        query={query}
        onQueryChange={setQuery}
      />

      <div className="text-xs text-slate-500">
        Showing {filteredProjects.length} result{filteredProjects.length !== 1 ? "s" : ""}
      </div>

      <div className="space-y-5">
        {filteredProjects.map((project) => (
          <HealthProjectCard
            key={project.id}
            project={project}
            actionSlot={
              <Button className="bg-[#022437] hover:bg-[#022437]/90" asChild>
                <Link href={`/projects/health/${project.id}`}>
                  View Project
                </Link>
              </Button>
            }
          />
        ))}
      </div>
    </section>
  );
}
