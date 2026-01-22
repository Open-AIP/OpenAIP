import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HealthProject } from "@/types";
import { CalendarDays, Building2, Users, PhilippinePeso } from "lucide-react";
import { formatPeso } from "@/lib/utils/formatting";
import { getProjectStatusBadgeClass } from "@/lib/utils/ui-helpers";

export default function HealthProjectCard({ 
  project,
  scope = "barangay"
}: { 
  project: HealthProject;
  scope?: "city" | "barangay";
}) {
  return (
    <Card className="border-slate-200 overflow-hidden">
      <CardContent className="px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr]">
          {/* Left image */}
            <div className="relative w-full max-w-[420px] aspect-[3/2] overflow-hidden rounded-xl bg-slate-100">             <div className="relative w-full max-w-[420px] aspect-[3/2] overflow-hidden rounded-xl bg-slate-100">
              <Image
                src={project.imageUrl}
                alt={project.title}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 420px"
              />
            </div>
          </div>

          {/* Right details */}
          <div className="px-6 flex flex-col">
            <div className="flex items-start justify-between pt-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-slate-900 truncate">{project.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{project.description}</p>
              </div>

              <Badge variant="outline" className={`rounded-full whitespace-nowrap ${getProjectStatusBadgeClass(project.status)}`}>
                {project.status}
              </Badge>
            </div>

            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Target Participants:</span>
                <span className="font-medium">{project.targetParticipants ?? 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Total:</span>
                <span className="font-medium">{project.totalTargetParticipants?.toLocaleString() ?? 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Office:</span>
                <span className="font-medium">{project.implementingOffice ?? 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Date:</span>
                <span className="font-medium">{project.month && project.year ? `${project.month} ${project.year}` : 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2">
                <PhilippinePeso className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Budget:</span>
                <span className="font-semibold text-[#022437]">{project.budgetAllocated != null ? formatPeso(project.budgetAllocated) : 'N/A'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button className="bg-[#022437] hover:bg-[#022437]/90" asChild>
                <Link href={`/${scope}/projects/health/${project.id}`}>
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
