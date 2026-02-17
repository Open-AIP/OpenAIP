import type { BudgetBreakdownVM, DateCardVM, WorkingOnVM } from "../types";
import BudgetDonutCard from "./BudgetDonutCard";
import DateCard from "./DateCard";
import WorkingOnCard from "./WorkingOnCard";

type BudgetBreakdownSectionProps = {
  breakdown: BudgetBreakdownVM;
  dateCard: DateCardVM;
  workingOn: WorkingOnVM;
  aipDetailsHref: string;
  onViewAipDetails?: () => void;
  onViewAllProjects?: () => void;
};

export default function BudgetBreakdownSection({
  breakdown,
  dateCard,
  workingOn,
  aipDetailsHref,
  onViewAipDetails,
  onViewAllProjects,
}: BudgetBreakdownSectionProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <BudgetDonutCard
        breakdown={breakdown}
        aipDetailsHref={aipDetailsHref}
        onViewAipDetails={onViewAipDetails}
        onViewAllProjects={onViewAllProjects}
      />
      <div className="space-y-4">
        <DateCard dateCard={dateCard} />
        <WorkingOnCard workingOn={workingOn} />
      </div>
    </div>
  );
}
