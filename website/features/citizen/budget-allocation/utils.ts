import type { BudgetAllocationItem, BudgetAllocationSummary } from "./types";

/**
 * Format currency to PHP format
 */
export const formatBudgetPHP = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Calculate year-over-year budget change
 */
export const calculateBudgetChange = (
  currentYear: BudgetAllocationSummary,
  previousYear: BudgetAllocationSummary
): {
  amount: number;
  percentage: number;
  trend: "increase" | "decrease" | "stable";
} => {
  const amount = currentYear.totalBudget - previousYear.totalBudget;
  const percentage = (amount / previousYear.totalBudget) * 100;
  const trend = amount > 0 ? "increase" : amount < 0 ? "decrease" : "stable";

  return { amount, percentage, trend };
};

/**
 * Calculate category distribution for a summary
 */
export const getCategoryDistribution = (
  summary: BudgetAllocationSummary
): Array<{
  category: string;
  budget: number;
  percentage: number;
  projectCount: number;
}> => {
  return summary.items.map((item) => ({
    category: item.category,
    budget: item.budget,
    percentage: item.percentage,
    projectCount: item.projectCount,
  }));
};

/**
 * Get top budget category
 */
export const getTopBudgetCategory = (
  summary: BudgetAllocationSummary
): BudgetAllocationItem | null => {
  if (summary.items.length === 0) return null;
  return summary.items.reduce((max, item) =>
    item.budget > max.budget ? item : max
  );
};

/**
 * Calculate total budget across multiple years
 */
export const calculateMultiYearTotalBudget = (
  summaries: BudgetAllocationSummary[]
): number => {
  return summaries.reduce((total, summary) => total + summary.totalBudget, 0);
};

/**
 * Calculate average budget per project
 */
export const calculateAverageBudgetPerProject = (
  summary: BudgetAllocationSummary
): number => {
  if (summary.totalProjects === 0) return 0;
  return summary.totalBudget / summary.totalProjects;
};

/**
 * Compare budget allocation across LGUs for the same year
 */
export const rankLgusByBudget = (
  summaries: BudgetAllocationSummary[]
): BudgetAllocationSummary[] => {
  return [...summaries].sort((a, b) => b.totalBudget - a.totalBudget);
};

/**
 * Normalize search text by trimming and converting to lowercase
 */
export const normalizeSearchText = (text: string): string => {
  return text.trim().toLowerCase();
};

/**
 * Format compact peso (e.g., ₱1.5M, ₱500K)
 */
export const formatCompactPeso = (amount: number): string => {
  if (amount >= 1000000) {
    return `₱${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `₱${(amount / 1000).toFixed(0)}K`;
  }
  return `₱${amount}`;
};

/**
 * Format percent (e.g., 8.33%)
 */
export const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

/**
 * Get category accent class
 */
export const categoryAccentClass = (categoryKey: string): string => {
  const classMap: Record<string, string> = {
    general: "border-blue-200",
    social: "border-green-200",
    economic: "border-amber-200",
    other: "border-purple-200",
  };
  return classMap[categoryKey] || "border-slate-200";
};

/**
 * Get category icon class
 */
export const categoryIconClass = (categoryKey: string): string => {
  const classMap: Record<string, string> = {
    general: "text-blue-500 bg-blue-50",
    social: "text-green-500 bg-green-50",
    economic: "text-amber-500 bg-amber-50",
    other: "text-purple-500 bg-purple-50",
  };
  return classMap[categoryKey] || "text-slate-500 bg-slate-50";
};

/**
 * Get trend badge class
 */
export const trendBadgeClass = (trend: string): string => {
  const classMap: Record<string, string> = {
    up: "bg-emerald-100 text-emerald-700",
    down: "bg-amber-100 text-amber-700",
    stable: "bg-slate-100 text-slate-700",
  };
  return classMap[trend] || "bg-slate-100 text-slate-700";
};
