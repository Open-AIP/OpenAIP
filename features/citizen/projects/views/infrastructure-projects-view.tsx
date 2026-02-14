"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import InfrastructureProjectCard from "@/features/projects/infrastructure/components/infrastructure-project-card";
import type { InfrastructureProject } from "@/features/projects/types";
import CitizenSectionBanner from "@/features/citizen/components/CitizenSectionBanner";
import ProjectFilters from "@/features/citizen/projects/components/project-filters";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  projects: InfrastructureProject[];
  lguLabel: string;
  lguOptions: string[];
};

export default function CitizenInfrastructureProjectsView({
  projects,
  lguLabel,
  lguOptions,
}: Props) {
  const years = useMemo(
    () => Array.from(new Set(projects.map((project) => project.year))).sort((a, b) => b - a),
    [projects]
  );

  const [yearFilter, setYearFilter] = useState<string>(String(years[0] ?? "all"));
  const [lguFilter, setLguFilter] = useState<string>(lguOptions[1] ?? "All LGUs");
  const [query, setQuery] = useState<string>("");

  const displayProjects = useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        title: `${lguLabel} - ${project.title}`,
      })),
    [projects, lguLabel]
  );

  const filteredProjects = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();
    return displayProjects.filter((project) => {
      const yearOk = yearFilter === "all" || project.year === Number(yearFilter);
      const lguOk = lguFilter === "All LGUs" || lguFilter === lguLabel;
      const queryOk =
        !loweredQuery ||
        project.title.toLowerCase().includes(loweredQuery) ||
        project.description?.toLowerCase().includes(loweredQuery) ||
        project.implementingOffice?.toLowerCase().includes(loweredQuery);

      return yearOk && lguOk && queryOk;
    });
  }, [displayProjects, yearFilter, lguFilter, query, lguLabel]);

  return (
    <section className="space-y-6">
      <CitizenSectionBanner
        title="Infrastructure Projects"
        description="Explore infrastructure projects funded by AIPs, including roads, drainage, public facilities, and community upgrades."
        align="center"
        eyebrow="OpenAIP"
      />

      <Card className="border-slate-200">
        <CardContent className="space-y-2 p-5">
          <div className="text-sm font-semibold text-slate-900">
            What are Infrastructure Projects?
          </div>
          <p className="text-sm text-slate-600">
            Infrastructure projects cover public works and facilities that improve access,
            safety, and the overall quality of life across the community.
          </p>
        </CardContent>
      </Card>

      <ProjectFilters
        years={years}
        yearFilter={yearFilter}
        onYearChange={setYearFilter}
        lguOptions={lguOptions}
        lguFilter={lguFilter}
        onLguChange={setLguFilter}
        query={query}
        onQueryChange={setQuery}
      />

      <div className="text-xs text-slate-500">
        Showing {filteredProjects.length} result{filteredProjects.length !== 1 ? "s" : ""}
      </div>

      <div className="space-y-5">
        {filteredProjects.map((project) => (
          <InfrastructureProjectCard
            key={project.id}
            project={project}
            actionSlot={
              <Button className="bg-[#022437] hover:bg-[#022437]/90" asChild>
                <Link href={`/projects/infrastructure/${project.id}`}>
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
