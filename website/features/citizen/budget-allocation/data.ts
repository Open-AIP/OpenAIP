import type {
  BudgetAllocationSummary,
  YearlyComparison,
} from "@/features/citizen/budget-allocation/types";
import {
  BUDGET_ALLOCATION_DATA,
  getAllLgusFromBudgetAllocation,
  getAllYearsFromBudgetAllocation,
  getBudgetAllocationSummary,
} from "@/mocks/fixtures/budget-allocation";

/**
 * Get budget allocation for a specific LGU and year
 */
export const getCitizenBudgetAllocationSummary = (
  lguName: string,
  year: number
): BudgetAllocationSummary => {
  const summary = getBudgetAllocationSummary(lguName, year);

  return {
    lguName,
    year,
    totalBudget: summary.totalBudget,
    totalProjects: summary.totalProjects,
    items: summary.categories.map((cat) => ({
      category: cat.category,
      projectCount: cat.projectCount,
      budget: cat.budget,
      percentage: cat.percentage,
    })),
  };
};

/**
 * Get yearly comparison for a specific LGU
 */
export const getCitizenBudgetAllocationYearlyComparison = (
  lguName: string
): YearlyComparison => {
  const years = getAllYearsFromBudgetAllocation();

  return {
    lguName,
    years: years.map((year) => {
      const summary = getBudgetAllocationSummary(lguName, year);

      return {
        year,
        totalBudget: summary.totalBudget,
        totalProjects: summary.totalProjects,
        byCategory: summary.categories.map((cat) => ({
          category: cat.category,
          projectCount: cat.projectCount,
          budget: cat.budget,
          percentage: cat.percentage,
        })),
      };
    }),
  };
};

/**
 * Get all available LGUs
 */
export const getCitizenBudgetAllocationLgus = (): string[] => {
  return getAllLgusFromBudgetAllocation();
};

/**
 * Get all available years
 */
export const getCitizenBudgetAllocationYears = (): number[] => {
  return getAllYearsFromBudgetAllocation();
};

/**
 * Get category breakdown for all LGUs in a specific year
 */
export const getCitizenBudgetAllocationByYear = (
  year: number
): BudgetAllocationSummary[] => {
  const lgus = getAllLgusFromBudgetAllocation();

  return lgus.map((lgu) => getCitizenBudgetAllocationSummary(lgu, year));
};

/**
 * Get raw budget allocation records
 */
export const getRawBudgetAllocationData = () => BUDGET_ALLOCATION_DATA;
