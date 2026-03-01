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
import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InfrastructureProject } from "@/features/projects/types";
import {
  CalendarDays,
  Building2,
  User,
  PhilippinePeso,
  Landmark,
  MapPin,
} from "lucide-react";
import { formatPeso } from "@/lib/formatting";
import { getProjectStatusBadgeClass } from "@/features/projects/utils/status-badges";
import {
  DEFAULT_PROJECT_IMAGE_SRC,
  PROJECT_LOGO_FALLBACK_SRC,
  resolveProjectImageSource,
} from "@/features/projects/shared/project-image";
import { toDateRangeLabel } from "@/features/projects/shared/project-date";

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
 * - Optional action slot for route-aware CTA
 * 
 * @param project - The infrastructure project data to display
 * @param actionSlot - Optional action element (e.g. View button)
 */
export default function InfrastructureProjectCard({ 
  project,
  actionSlot,
  useLogoFallback = false,
}: { 
  project: InfrastructureProject;
  actionSlot?: ReactNode;
  useLogoFallback?: boolean;
}) {
  const [imageSrc, setImageSrc] = useState<string>(
    () =>
      resolveProjectImageSource(project.imageUrl, {
        useLogoFallback,
        defaultSource: DEFAULT_PROJECT_IMAGE_SRC,
      }) ?? DEFAULT_PROJECT_IMAGE_SRC
  );

  useEffect(() => {
    setImageSrc(
      resolveProjectImageSource(project.imageUrl, {
        useLogoFallback,
        defaultSource: DEFAULT_PROJECT_IMAGE_SRC,
      }) ?? DEFAULT_PROJECT_IMAGE_SRC
    );
  }, [project.imageUrl, useLogoFallback]);

  const dateRange = toDateRangeLabel(project.startDate, project.targetCompletionDate) ?? "N/A";

  return (
    <Card className="border-slate-200 overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr]">
          {/* fixed image + cover */}
          <div className="w-full lg:w-[420px] flex items-center justify-center bg-slate-100">
            <div className="relative w-full h-[280px] overflow-hidden rounded-xl bg-slate-100">
                <Image
                    src={imageSrc}
                    alt={project.title}
                    fill
                    className="object-cover object-center"
                    sizes="482px"
                    onError={() => {
                      if (!useLogoFallback) return;
                      setImageSrc((current) =>
                        current === PROJECT_LOGO_FALLBACK_SRC
                          ? current
                          : PROJECT_LOGO_FALLBACK_SRC
                      );
                    }}
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
              <div className="flex items-center gap-2 sm:col-span-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Date:</span>
                <span className="font-medium">{dateRange}</span>
              </div>

              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">LGU:</span>
                <span className="font-medium">{project.lguLabel ?? "N/A"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Office:</span>
                <span className="font-medium">{project.implementingOffice || "N/A"}</span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Contractor:</span>
                <span className="font-medium">{project.contractorName || "N/A"}</span>
              </div>

              <div className="flex items-center gap-2">
                <PhilippinePeso className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Contract Cost:</span>
                <span className="font-semibold text-[#022437]">
                  {project.contractCost > 0 ? formatPeso(project.contractCost) : "N/A"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Funding:</span>
                <span className="font-medium">{project.fundingSource || "N/A"}</span>
              </div>
            </div>

            {actionSlot ? <div className="flex justify-end pt-2">{actionSlot}</div> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
