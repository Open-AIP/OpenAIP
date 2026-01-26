import { Card, CardContent } from "@/components/ui/card";
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
      icon: FileText,
      color: "text-slate-600",
    },
    {
      label: "Published",
      value: stats.published,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: "Under Review",
      value: stats.underReview,
      icon: Clock,
      color: "text-blue-600",
    },
    {
      label: "Pending Review",
      value: stats.pendingReview,
      icon: AlertCircle,
      color: "text-yellow-600",
    },
    {
      label: "For Revision",
      value: stats.forRevision,
      icon: Edit,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="flex-1 min-w-[180px] border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Icon className={`h-8 w-8 ${stat.label === "Total AIP" ? "text-slate-400" : stat.color}`} />
                <div className="flex-1">
                  <div className="text-sm text-slate-500">{stat.label}</div>
                  <div className={`text-2xl font-bold ${stat.label === "Total AIP" ? "text-slate-900" : stat.color}`}>
                    {stat.value}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}