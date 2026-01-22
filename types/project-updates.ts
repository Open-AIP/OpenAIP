export type ProjectUpdate = {
  id: string;
  title: string;
  date: string; // "January 20, 2026"
  description: string;
  progressPercent: number; // 0..100
  photoUrls?: string[];
};

export type ProjectHeaderModel = {
  breadcrumbLeft: string; // "Health Project" or "Infrastructure Projects"
  breadcrumbRight: string; // "Detail & Updates"
  title: string;
  statusText: string; // "Ongoing"
  statusTone?: "success" | "info" | "neutral" | "warning";
  metaCards: Array<{ label: string; value: string }>;
};
