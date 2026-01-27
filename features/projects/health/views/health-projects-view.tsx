/**
 * Health Projects View Component
 * 
 * Main listing and management interface for health projects.
 * Provides filtering, searching, and overview of all health initiatives
 * under the Annual Investment Program.
 * 
 * @module feature/projects/health/health-projects-view
 */

"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import HealthProjectCard from "../components/health-project-card";
import type { HealthProject } from "@/types";
import { getProjectYears } from "@/mock/aips";
import { Search } from "lucide-react";

/**
 * HealthProjectsView Component
 * 
 * Displays and manages the list of health projects.
 * Features:
 * - Year-based filtering
 * - Full-text search (title, description, office)
 * - Project count display
 * - Responsive card-based layout
 * - Breadcrumb navigation
 * 
 * @param projects - Array of health projects to display
 * @param scope - Administrative scope (city or barangay)
 */
export default function HealthProjectsView({ 
  projects,
  scope = "barangay"
}: { 
  projects: HealthProject[];
  scope?: "city" | "barangay";
}) {
  const years = useMemo(() => getProjectYears(projects), [projects]);

  const [year, setYear] = useState<string>(String(years[0] ?? "all"));
  const [query, setQuery] = useState<string>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return projects.filter((p) => {
      const yearOk = year === "all" ? true : p.year === Number(year);
      const qOk =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.office?.toLowerCase().includes(q);
      return yearOk && qOk;
    });
  }, [projects, year, query]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-400">
        Projects / <span className="text-slate-600">Health Project</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Health Project</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage, monitor, and update health-related programs and initiatives under the Annual Investment Program.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-slate-500">Filter by Year</div>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-slate-500">Search Projects</div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by project name or keyword"
                className="h-11 pl-9 bg-slate-50 border-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-slate-500">Showing {filtered.length} projects</div>

      {/* List */}
      <div className="space-y-5">
        {filtered.map((p) => (
          <HealthProjectCard key={p.id} project={p} scope={scope} />
        ))}
      </div>
    </div>
  );
}
