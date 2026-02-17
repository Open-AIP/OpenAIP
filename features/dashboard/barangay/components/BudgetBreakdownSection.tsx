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
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      <div className="xl:col-span-4">
        <BudgetDonutCard
          breakdown={breakdown}
          aipDetailsHref={aipDetailsHref}
          onViewAipDetails={onViewAipDetails}
          onViewAllProjects={onViewAllProjects}
        />
      </div>
      <div className="space-y-4 xl:col-span-1">
        <DateCard dateCard={dateCard} />
        <WorkingOnCard workingOn={workingOn} />
      </div>
    </div>
  );
}
