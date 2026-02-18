import { mapCitizenDashboardToVM } from "@/lib/mappers/dashboard/citizen";
import { createMockCitizenDashboardRepo } from "@/lib/repos/citizen-dashboard/repo.mock";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runCitizenDashboardMapperTests() {
  const repo = createMockCitizenDashboardRepo();
  const payload = await repo.getDashboard({
    scope_type: "city",
    scope_id: "city_001",
    fiscal_year: 2026,
    search: "",
  });

  const vm = mapCitizenDashboardToVM(payload);
  assert(vm.controls.selectedFiscalYear === 2026, "Expected selected fiscal year to remain 2026");
  assert(vm.budgetSummary.totalBudget > 0, "Expected non-zero total budget");
  assert(vm.categoryAllocation.length > 0, "Expected category allocation entries");
  assert(vm.highlightProjects.length <= 2, "Expected at most two highlight projects");
  assert(vm.transparencyJourney.length === 5, "Expected five transparency journey steps");

  for (let i = 1; i < vm.topProjects.length; i += 1) {
    assert(
      vm.topProjects[i - 1].budget >= vm.topProjects[i].budget,
      "Expected top projects sorted by budget desc"
    );
  }

  const barangayPayload = await repo.getDashboard({
    scope_type: "barangay",
    scope_id: "brgy_mamatid",
    fiscal_year: 2026,
    search: "",
  });
  const barangayVm = mapCitizenDashboardToVM(barangayPayload);

  assert(
    barangayVm.controls.selectedScopeType === "barangay",
    "Expected barangay scope to be preserved"
  );
  assert(
    barangayVm.lguStatusBoard.every((row) => row.lguType === "Barangay"),
    "Expected barangay scope board rows only"
  );
}

