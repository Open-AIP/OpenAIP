/**
 * Infrastructure Project Information Card Component
 * 
 * Displays detailed information about an infrastructure project in a card format.
 * Includes project image, description, and key metrics specific to infrastructure.
 * Provides navigation to add additional information.
 * 
 * @module feature/projects/infrastructure/project-information-card
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InfrastructureProject } from "@/types";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  User,
  Calendar,
  PhilippinePeso,
  Landmark,
  Plus,
  Flag,
} from "lucide-react";
import { formatPeso } from "@/lib/utils/formatting";
import { PRIMARY_BUTTON_CLASS } from "@/constants/theme";

/**
 * InfrastructureProjectInformationCard Component
 * 
 * Displays comprehensive infrastructure project information including:
 * - Project image
 * - Description
 * - Implementing office
 * - Contractor name
 * - Start date and target completion
 * - Funding source
 * - Contract cost
 * - Add Information action button
 * 
 * @param aipYear - The AIP year for context
 * @param project - Complete infrastructure project data
 * @param scope - Administrative scope (city or barangay) for routing
 */
export default function InfrastructureProjectInformationCard({
  aipYear,
  project,
  scope = "barangay"
}: {
  aipYear: number;
  project: InfrastructureProject;
  scope?: "city" | "barangay";
}) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Project Information</h2>
            <Button asChild className={PRIMARY_BUTTON_CLASS}>
              <Link href={`/${scope}/projects/infrastructure/${project.id}/add-information`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Information
              </Link>
            </Button>

        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Project Image */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-100">
              <Image
                src={project.imageUrl}
                alt={project.title}
                fill
                className="object-cover object-center"
                sizes="(min-width: 1024px) 384px, 100vw"
              />
            </div>
          </div>

          {/* Project Details */}
          <div className="flex-1">

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {project.description ||
                "Infrastructure project aimed at improving community access, safety, and quality of public facilities."}
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Implementing Office:</span>
                <span className="font-medium text-slate-900">
                  {project.implementingOffice || (scope === "city" ? "City Engineering Office" : "Barangay Engineering Office")}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Contractor:</span>
                <span className="font-medium text-slate-900">
                  {project.contractorName || "N/A"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Start Date:</span>
                <span className="font-medium text-slate-900">
                  {project.startDate || `January ${aipYear}`}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Flag className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Target Completion:</span>
                <span className="font-medium text-slate-900">
                  {project.targetCompletionDate || "N/A"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Landmark className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Funding Source:</span>
                <span className="font-medium text-slate-900">
                  {project.fundingSource || "N/A"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <PhilippinePeso className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Contract Cost:</span>
                <span className="font-semibold text-[#022437]">
                  {project.contractCost != null ? formatPeso(project.contractCost) : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
