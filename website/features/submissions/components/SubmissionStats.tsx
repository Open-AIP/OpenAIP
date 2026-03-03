import KpiCard, { type KpiCardAccent } from "@/components/kpi-card";
import { FileText, CheckCircle, Clock, AlertCircle, Edit } from "lucide-react";

interface SubmissionStatsProps {
  stats: {
    total: number;
    published: number;
    underReview: number;
    pendingReview: number;
    forRevision: number;
  };
}

export function SubmissionStats({ stats }: SubmissionStatsProps) {
  const statCards = [
    {
      label: "Total AIP",
      value: stats.total,
      subtext: "Across selected filters",
      icon: <FileText className="h-5 w-5" strokeWidth={2.2} />,
      accent: "slate" as KpiCardAccent,
    },
    {
      label: "Published",
      value: stats.published,
      subtext: "As of today",
      icon: <CheckCircle className="h-5 w-5" strokeWidth={2.2} />,
      accent: "green" as KpiCardAccent,
    },
    {
      label: "Under Review",
      value: stats.underReview,
      subtext: "As of today",
      icon: <Clock className="h-5 w-5" strokeWidth={2.2} />,
      accent: "blue" as KpiCardAccent,
    },
    {
      label: "Pending Review",
      value: stats.pendingReview,
      subtext: "As of today",
      icon: <AlertCircle className="h-5 w-5" strokeWidth={2.2} />,
      accent: "yellow" as KpiCardAccent,
    },
    {
      label: "For Revision",
      value: stats.forRevision,
      subtext: "As of today",
      icon: <Edit className="h-5 w-5" strokeWidth={2.2} />,
      accent: "orange" as KpiCardAccent,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {statCards.map((stat) => (
        <KpiCard
          key={stat.label}
          variant="split"
          label={stat.label}
          value={stat.value}
          subtext={stat.subtext}
          icon={stat.icon}
          accent={stat.accent}
          accentMode="value"
        />
      ))}
    </div>
  );
}
