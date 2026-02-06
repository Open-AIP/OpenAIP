import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";
import type { AipSubmissionItem } from "./types/submissions.types";
import {
  getAipStatusBadgeClass,
  getAipStatusLabel,
} from "./presentation/submissions.presentation";

interface SubmissionTableProps {
  aips: AipSubmissionItem[];
}

const getTimeSince = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Unknown";
  
  const now = Date.now();
  const diffInMs = now - date.getTime();
  
  if (diffInMs < 0) return "just now";  
  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (seconds > 0) return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  
  return "just now";
};

function formatDateSubmitted(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SubmissionTable({ aips }: SubmissionTableProps) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Submitted AIP Lists</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Barangay
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Date Submitted
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Reviewer
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Duration
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {aips.map((aip, index) => (
                <tr key={aip.id ?? `aip-${index}`} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4 text-sm text-slate-900">
                    {aip.barangayName || "Barangay"}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">
                    {formatDateSubmitted(aip.uploadedAt)}
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      variant="outline"
                      className={`rounded-full ${getAipStatusBadgeClass(aip.status)}`}
                    >
                      {getAipStatusLabel(aip.status)}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">
                    {aip.reviewerName ?? "Not yet assigned"}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">
                    {getTimeSince(aip.uploadedAt)}
                  </td>
                  <td className="py-4 px-4">
                    {(() => {
                      const isPending = aip.status === "pending_review";
                      const isUnderReview = aip.status === "under_review";
                      const href = isPending || isUnderReview
                        ? `/city/submissions/aips/${aip.id}?mode=review`
                        : `/city/submissions/aips/${aip.id}`;
                      const label = isPending
                        ? "Review"
                        : isUnderReview
                          ? "Continue Review"
                          : "View";

                      return (
                    <Button
                      variant={isPending ? "default" : "outline"}
                      size="sm"
                      className={
                        isPending
                          ? "gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                          : "gap-2"
                      }
                      asChild
                    >
                      <Link href={href}>
                        <Eye className="h-4 w-4" />
                        {label}
                      </Link>
                    </Button>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
