import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { HealthProject } from "@/types";
import Image from "next/image";
import { Users, Hash, Building2, Calendar, DollarSign, Plus } from "lucide-react";
import Link from "next/link";
import { formatPeso } from "@/lib/utils/formatting";
import { PRIMARY_BUTTON_CLASS } from "@/constants/theme";

export default function ProjectInformationCard({
  aipYear,
  project,
  scope = "barangay"
}: {
  aipYear: number;
  project: HealthProject;
  scope?: "city" | "barangay";
}) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Project Information</h2>
            <Button asChild className={PRIMARY_BUTTON_CLASS}>
              <Link href={`/${scope}/projects/health/${project.id}/add-information`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Information
              </Link>
            </Button>
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
                  {project.office || "Barangay Health Office"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Date:</span>
                <span className="font-medium text-slate-900">
                  {project.date || `January ${aipYear}`}
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
