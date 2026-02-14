import { BudgetAllocationTable, buildBudgetAllocation } from "@/features/aip/components/budget-allocation-table";
import { AIPS_TABLE } from "@/mocks/fixtures/aip/aips.table.fixture";
import { AIP_PROJECT_ROWS_TABLE } from "@/mocks/fixtures/aip/aip-project-rows.table.fixture";

const CitizenBudgetAllocationPage = () => {
  const latestAip =
    AIPS_TABLE.length > 0
      ? AIPS_TABLE.reduce((latest, current) =>
          current.year > latest.year ? current : latest
        )
      : null;

  const rowsForAip = latestAip
    ? AIP_PROJECT_ROWS_TABLE.filter((row) => row.aipId === latestAip.id)
    : [];

  const allocation = buildBudgetAllocation(rowsForAip);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Budget Allocation</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
        View how public funds are distributed by service category and priority area to support transparent,
        evidence-based monitoring for citizens and stakeholders.
      </p>

      <BudgetAllocationTable
        rows={allocation.rows}
        totalBudget={allocation.totalBudget}
        totalProjects={allocation.totalProjects}
      />
    </section>
  );
};

export default CitizenBudgetAllocationPage;
