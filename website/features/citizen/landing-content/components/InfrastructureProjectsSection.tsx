import { CardContent } from "@/components/ui/card";
import { formatNumber, formatPeso } from "@/lib/formatting";
import type { ProjectHighlightVM } from "@/lib/domain/landing-content";
import CardShell from "./CardShell";
import FullScreenSection from "./FullScreenSection";
import KpiCard from "./KpiCard";
import PrimaryButton from "./PrimaryButton";
import SectionHeader from "./SectionHeader";

type InfrastructureProjectsSectionProps = {
  vm: ProjectHighlightVM;
};

export default function InfrastructureProjectsSection({ vm }: InfrastructureProjectsSectionProps) {
  return (
    <FullScreenSection id="infrastructure-projects" className="bg-[#E8E3DD]">
      <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {vm.projects.map((project) => (
            <CardShell key={project.id} className="min-w-[290px] snap-start py-0">
              <CardContent className="space-y-4 p-5">
                <span className="inline-block rounded-full bg-[#EC4899]/15 px-3 py-1 text-[11px] font-semibold text-[#BE185D]">
                  {project.tagLabel}
                </span>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#0C2C3A]">{project.title}</h3>
                  <p className="text-sm text-slate-600">{project.subtitle}</p>
                </div>
                <p className="text-xl font-semibold text-[#0E5D6F]">{formatPeso(project.budget)}</p>
                <ul className="space-y-1 text-xs text-slate-500">
                  {project.meta.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <PrimaryButton label="View Project" href="/projects/infrastructure" className="w-full" />
              </CardContent>
            </CardShell>
          ))}
        </div>

        <div className="space-y-5">
          <SectionHeader title={vm.heading} subtitle={vm.description} />
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard label="Total Budget" value={formatPeso(vm.totalBudget)} />
            <KpiCard label={vm.secondaryKpiLabel} value={formatNumber(vm.secondaryKpiValue)} />
          </div>
        </div>
      </div>
    </FullScreenSection>
  );
}

