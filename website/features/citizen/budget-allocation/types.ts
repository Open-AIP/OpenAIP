export type BudgetAllocationItem = {
  category: string;
  projectCount: number;
  budget: number;
  percentage: number;
};

export type BudgetAllocationSummary = {
  lguName: string;
  year: number;
  totalBudget: number;
  totalProjects: number;
  items: BudgetAllocationItem[];
};

export type YearlyComparison = {
  lguName: string;
  years: {
    year: number;
    totalBudget: number;
    totalProjects: number;
    byCategory: BudgetAllocationItem[];
  }[];
};
