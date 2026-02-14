/**
 * Health Project Information Card Component
 * 
 * Displays detailed information about a health project in a card format.
 * Includes project image, description, and key metrics.
 * Provides navigation to add additional information.
 * 
 * @module feature/projects/health/project-information-card
 */

import { Card, CardContent } from "@/components/ui/card";
import type { HealthProject } from "@/features/projects/types";
import Image from "next/image";
import { Users, Hash, Building2, Calendar, DollarSign } from "lucide-react";
import { formatPeso } from "@/lib/formatting";

/**
 * ProjectInformationCard Component (Health)
 * 
 * Displays comprehensive project information including:
 * - Project image
 * - Title and description
 * - Target participants (specific and total)
 * - Implementing office
 * - Schedule/date information
 * - Budget allocation
 * - Add Information action button
 * 
 * @param aipYear - The AIP year for context
 * @param project - Complete health project data
 * @param actionSlot - Optional action element (e.g. Add Information button)
 * @param mode - Display mode (lgu or citizen)
 */
export default function ProjectInformationCard({
  aipYear,
  project,
  actionSlot,
  mode = "lgu",
}: {
  aipYear: number;
  project: HealthProject;
  actionSlot?: React.ReactNode;
  mode?: "lgu" | "citizen";
}) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Project Information</h2>
          {mode === "lgu" ? actionSlot : null}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Project Image */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
              <Image
                src={project.imageUrl || "/default/default-no-image.jpg"}
                alt={project.title}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Project Details */}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              {project.title}
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {project.description || "No description available."}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Target Participants:</span>
                <span className="font-medium text-slate-900">{project.targetParticipants ?? "N/A"}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Hash className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Total:</span>
                <span className="font-medium text-slate-900">
                  {project.totalTargetParticipants?.toLocaleString() ?? "N/A"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Office:</span>
                <span className="font-medium text-slate-900">
                  {project.implementingOffice || "Barangay Health Office"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Date:</span>
                <span className="font-medium text-slate-900">
                  {project.month || `January ${aipYear}`}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Budget:</span>
                <span className="font-semibold text-[#022437]">
                  {project.budgetAllocated != null ? formatPeso(project.budgetAllocated) : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
