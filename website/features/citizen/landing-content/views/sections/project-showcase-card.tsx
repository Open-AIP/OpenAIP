import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { ProjectCardVM } from "@/lib/domain/landing-content";
import { cn } from "@/ui/utils";

type ProjectShowcaseCardProps = {
  project: ProjectCardVM;
  budgetLabel: string;
  className?: string;
};

export default function ProjectShowcaseCard({ project, budgetLabel, className }: ProjectShowcaseCardProps) {
  return (
    <article
      tabIndex={0}
      className={cn(
        "h-[494px] w-[400px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#67E8F9]",
        className
      )}
    >
      <div className="relative h-[218px]">
        <Image src={project.imageSrc} alt={project.title} fill className="object-cover" sizes="400px" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/45" />
        <div className="absolute left-3 top-3 rounded-full bg-[#EC4899]/90 px-3 py-1 text-[11px] font-semibold text-white">
          {project.tagLabel}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-[#BE185D]">
          {budgetLabel}
        </div>
      </div>
      <div className="flex h-[275px] flex-col gap-4 p-5">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold leading-tight text-[#0C2C3A]">{project.title}</h3>
          <p className="text-sm text-slate-600">{project.subtitle}</p>
        </div>
        <div className="mt-auto">
          <Button asChild variant="outline" className="w-full rounded-full border-[#3A80A6] text-[#25647E]">
            <Link href="/projects/health">View Project</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
