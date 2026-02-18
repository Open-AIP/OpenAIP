import { Suspense } from "react";
import { CitizenBudgetAllocationView } from "@/features/citizen/budget-allocation";

export default function CitizenBudgetAllocationPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading budget allocation...</div>}>
      <CitizenBudgetAllocationView />
    </Suspense>
  );
}
