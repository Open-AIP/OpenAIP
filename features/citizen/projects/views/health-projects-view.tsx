"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import HealthProjectCard from "@/features/projects/health/components/health-project-card";
import type { HealthProject } from "@/features/projects/types";
import CitizenSectionBanner from "@/features/citizen/components/CitizenSectionBanner";

type Props = {
  projects: HealthProject[];
  barangayLabel: string;
  lguOptions: string[];
};

export default function CitizenHealthProjectsView({
  projects,
  barangayLabel,
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
        title: `${barangayLabel} - ${project.title}`,
      })),
    [projects, barangayLabel]
  );

  const filteredProjects = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();
    return displayProjects.filter((project) => {
      const yearOk = yearFilter === "all" || project.year === Number(yearFilter);
      const lguOk = lguFilter === "All LGUs" || lguFilter === barangayLabel;
      const queryOk =
        !loweredQuery ||
        project.title.toLowerCase().includes(loweredQuery) ||
        project.description?.toLowerCase().includes(loweredQuery) ||
        project.implementingOffice?.toLowerCase().includes(loweredQuery);

      return yearOk && lguOk && queryOk;
    });
  }, [displayProjects, yearFilter, lguFilter, query, barangayLabel]);

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

      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-xs text-slate-500">Filters</div>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Fiscal Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-slate-500">LGU</div>
              <Select value={lguFilter} onValueChange={setLguFilter}>
                <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Select LGU" />
                </SelectTrigger>
                <SelectContent>
                  {lguOptions.map((lgu) => (
                    <SelectItem key={lgu} value={lgu}>
                      {lgu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-slate-500">Search</div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search projects..."
                  className="h-10 border-slate-200 bg-slate-50 pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-slate-500">
        Showing {filteredProjects.length} result{filteredProjects.length !== 1 ? "s" : ""}
      </div>

      <div className="space-y-5">
        {filteredProjects.map((project) => (
          <HealthProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
