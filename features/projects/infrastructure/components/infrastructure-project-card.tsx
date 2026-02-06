/**
 * Infrastructure Project Card Component
 * 
 * Displays a comprehensive card view for infrastructure projects.
 * Shows project image, details, timeline, contractor information, funding, and status.
 * Provides navigation to detailed project view.
 * 
 * @module feature/projects/infrastructure/infrastructure-project-card
 */

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InfrastructureProject } from "@/features/projects/types";
import { CalendarDays, Building2, User, PhilippinePeso, Landmark } from "lucide-react";
import { formatPeso } from "@/lib/utils/formatting";
import { getProjectStatusBadgeClass } from "@/lib/utils/ui-helpers";

/**
 * InfrastructureProjectCard Component
 * 
 * Renders a detailed card for infrastructure projects including:
 * - Project image
 * - Title and description
 * - Start date and target completion
 * - Implementing office and contractor
 * - Contract cost and funding source
 * - Status badge
 * - View project button
 * 
 * @param project - The infrastructure project data to display
 * @param scope - Administrative scope (city or barangay) for routing
 */
export default function InfrastructureProjectCard({ 
  project,
  scope = "barangay"
}: { 
  project: InfrastructureProject;
  scope?: "city" | "barangay";
}) {
  return (
    <Card className="border-slate-200 overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr]">
          {/* fixed image + cover */}
          <div className="w-full lg:w-[420px] flex items-center justify-center bg-slate-100">
            <div className="relative w-full h-[280px] overflow-hidden rounded-xl bg-slate-100">
                <Image
                    src={project.imageUrl}
                    alt={project.title}
                    fill
                    className="object-cover object-center"
                    sizes="482px"
                />
                </div>
            </div>          
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{project.description}</p>
              </div>

              <Badge variant="outline" className={`rounded-full ${getProjectStatusBadgeClass(project.status)}`}>
                {project.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-10 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Start Date:</span>
                <span className="font-medium">{project.startDate}</span>
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Target Completion:</span>
                <span className="font-medium">{project.targetCompletionDate}</span>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Office:</span>
                <span className="font-medium">{project.implementingOffice}</span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Contractor:</span>
                <span className="font-medium">{project.contractorName}</span>
              </div>

              <div className="flex items-center gap-2">
                <PhilippinePeso className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Contract Cost:</span>
                <span className="font-semibold text-[#022437]">{formatPeso(project.contractCost)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Funding:</span>
                <span className="font-medium">{project.fundingSource}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button className="bg-[#022437] hover:bg-[#022437]/90" asChild>
                <Link href={`/${scope}/projects/infrastructure/${project.id}`}>
                  View Project
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
