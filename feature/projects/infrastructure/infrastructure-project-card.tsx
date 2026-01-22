import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InfrastructureProject } from "@/types";
import { CalendarDays, Building2, User, PhilippinePeso, Landmark } from "lucide-react";

function peso(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusPill(status: InfrastructureProject["status"]) {
  switch (status) {
    case "Ongoing":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Planning":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Completed":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "On Hold":
    default:
      return "bg-amber-50 text-amber-800 border-amber-200";
  }
}

export default function InfrastructureProjectCard({ project }: { project: InfrastructureProject }) {
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

              <Badge variant="outline" className={`rounded-full ${statusPill(project.status)}`}>
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
                <span className="font-semibold text-[#022437]">{peso(project.contractCost)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Funding:</span>
                <span className="font-medium">{project.fundingSource}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button className="bg-[#022437] hover:bg-[#022437]/90" asChild>
                <Link href={`/barangay/projects/infrastructure/${project.id}`}>
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
