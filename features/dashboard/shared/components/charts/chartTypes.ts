import type { ReactNode } from "react";

export type ChartDatum = Record<string, string | number | null | undefined>;

export type ChartMetric = {
  key: string;
  label: string;
};

export type ChartCardPropsBase = {
  title: string;
  subtitle?: string;
  helperText?: string;
  className?: string;
  loading?: boolean;
  emptyText?: string;
  actionSlot?: ReactNode;
};

export type LineSeriesVM = {
  data: ChartDatum[];
  xKey: string;
  lines: Array<ChartMetric & { stroke?: string }>;
};

export type BarSeriesVM = {
  data: ChartDatum[];
  xKey: string;
  bars: Array<ChartMetric & { fill?: string; stackId?: string }>;
};

export type DonutSeriesVM = {
  data: Array<{ name: string; value: number }>;
  innerRadius?: number;
  outerRadius?: number;
};
