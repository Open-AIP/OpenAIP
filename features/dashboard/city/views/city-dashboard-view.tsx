"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Clock3,
  Eye,
  ExternalLink,
  FileClock,
  GitPullRequestArrow,
  Search,
  Users,
  UserRoundCheck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChartCard, DonutChartCard, LineChartCard } from "@/features/dashboard/components/charts";
import { formatDate, formatNumber } from "@/lib/formatting";
import { getAipStatusBadgeClass } from "@/features/aip/utils";
import { getAipStatusLabel } from "@/features/submissions/presentation/submissions.presentation";
import { useCityDashboard } from "../hooks/useCityDashboard";
import type { CityDashboardData } from "../types";
import type { AipStatus } from "@/lib/contracts/databasev2/enums";

const AIP_STATUS_ORDER: AipStatus[] = ["draft", "pending_review", "under_review", "for_revision", "published"];

const AIP_STATUS_COLOR: Record<AipStatus, string> = {
  draft: "#94a3b8",
  pending_review: "#eab308",
  under_review: "#3b82f6",
  for_revision: "#f97316",
  published: "#22c55e",
};

function HorizontalAgingChart({ data }: { data: CityDashboardData["pendingReviewAging"] }) {
  const maxCount = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{item.label}</span>
            <span>{item.count}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-teal-700"
              style={{ width: `${Math.max((item.count / maxCount) * 100, item.count > 0 ? 10 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}


export default function CityDashboardView() {
  const { filters, data, isLoading, error, availableYears, setYear, setSearch } = useCityDashboard();

  const kpiCards = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "Pending Review",
        value: data.queueMetrics.pendingReview,
        footnote: data.queueMetrics.asOfLabel,
        icon: FileClock,
      },
      {
        label: "Under Review",
        value: data.queueMetrics.underReview,
        footnote: data.queueMetrics.asOfLabel,
        icon: Clock3,
      },
      {
        label: "For Revision",
        value: data.queueMetrics.forRevision,
        footnote: data.queueMetrics.asOfLabel,
        icon: GitPullRequestArrow,
      },
      {
        label: "Available to Claim",
        value: data.queueMetrics.availableToClaim,
        footnote: data.queueMetrics.availableToClaimLabel,
        icon: UserRoundCheck,
      },
      {
        label: "Oldest Pending",
        value: data.queueMetrics.oldestPendingDays,
        footnote: "days in queue",
        icon: Zap,
      },
    ];
  }, [data]);

  const onReply = (commentId: string) => {
    console.info("[TODO] Wire reply action to feedback thread screen", { commentId });
  };

  const onViewAllComments = () => {
    console.info("[TODO] Wire view all comments route/action");
  };

  const orderedStatusDistribution = useMemo(
    () =>
      data
        ? [...data.statusDistribution].sort(
            (a, b) => AIP_STATUS_ORDER.indexOf(a.status) - AIP_STATUS_ORDER.indexOf(b.status)
          )
        : [],
    [data]
  );

  if (isLoading && !data) {
    return <div className="text-sm text-slate-500">Loading city dashboard...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-rose-600">{error ?? "Unable to load dashboard."}</div>;
  }

  return (
    <div className="space-y-6">
      {/* [DISCOVERY] Reuses existing route group `app/(lgu)/city/(authenticated)/(dashboard)`,
          shadcn UI primitives in `components/ui/*`, and AIP status helpers from `features/aip` + `features/submissions`.
          Data flow follows `lib/repos/*` selector pattern with mock fixtures in `mocks/fixtures/*`. */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-semibold text-slate-900">Welcome to OpenAIP</h1>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_160px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={filters.search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 border-slate-200 bg-slate-50 pl-9"
            placeholder="Global search..."
          />
        </div>

        <Select value={String(filters.year)} onValueChange={(value) => setYear(Number(value))}>
          <SelectTrigger className="h-10 border-slate-200 bg-slate-50">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="gap-3 border-slate-200 py-4">
              <CardContent className="space-y-2 px-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{kpi.label}</span>
                  <Icon className="h-4 w-4 text-slate-500" />
                </div>
                <div className="text-3xl font-semibold text-slate-900">{formatNumber(kpi.value)}</div>
                <div className="text-[11px] text-slate-500">{kpi.footnote}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="grid gap-6 lg:grid-cols-2">
          <DonutChartCard
            title="Status Distribution"
            series={{
              data: orderedStatusDistribution.map((item) => ({ name: getAipStatusLabel(item.status), value: item.count })),
            }}
            centerLabel={{
              title: "Total",
              value: formatNumber(orderedStatusDistribution.reduce((sum, item) => sum + item.count, 0)),
            }}
            showLegend
            palette={orderedStatusDistribution.map((item) => AIP_STATUS_COLOR[item.status])}
            height={250}
            emptyText="No status distribution data."
          />

          <Card className="gap-4 border-slate-200 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm font-semibold">Pending Review Aging</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <HorizontalAgingChart data={data.pendingReviewAging} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden border-slate-200 py-0">
            <CardContent className="bg-linear-to-r from-sky-900 to-blue-500 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="text-5xl font-semibold leading-none">{data.dateCard.day}</div>
                <div>
                  <div className="text-xs font-semibold">{data.dateCard.weekday}</div>
                  <div className="text-xs uppercase tracking-wide">{data.dateCard.month} {data.dateCard.year}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 border-slate-200 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm font-semibold">You&apos;re Working On</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4">
              {data.workingOn.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="text-xs font-medium text-slate-700">{item.barangayName}</div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Badge variant="outline" className={`rounded-full text-[11px] ${getAipStatusBadgeClass(item.status)}`}>
                      {getAipStatusLabel(item.status)}
                    </Badge>
                    <span className="text-[11px] text-slate-500">in status for {item.daysInStatus} days</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card className="gap-4 border-slate-200 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-2xl font-semibold">City AIP Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              {data.cityAipStatus.hasCityAipForYear ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <div className="font-semibold">{data.cityAipStatus.warningTitle}</div>
                  <div>{data.cityAipStatus.warningMessage}</div>
                </div>
              ) : (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{data.cityAipStatus.warningTitle}</span>
                  </div>
                  <div className="mt-1">{data.cityAipStatus.warningMessage}</div>
                </div>
              )}

              <Button asChild className="w-full bg-teal-700 text-white hover:bg-teal-800">
                <Link href={data.cityAipStatus.ctaHref}>Upload City AIP for {filters.year}</Link>
              </Button>
            </CardContent>
          </Card>

          <BarChartCard
            title="Publication Timeline"
            series={{
              data: data.publicationTimeline.map((item) => ({ year: String(item.year), publishedCount: item.publishedCount })),
              xKey: "year",
              bars: [{ key: "publishedCount", label: "Published", fill: "#22c55e" }],
            }}
            showLegend={false}
            showGrid
            height={190}
            emptyText="No publication timeline data."
            className="gap-4"
          />

          <Card className="gap-4 border-slate-200 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm font-semibold">City AIPs by Year</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cityAipsByYear.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.year}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`rounded-full ${getAipStatusBadgeClass(row.status)}`}>
                          {getAipStatusLabel(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.uploadedBy}</TableCell>
                      <TableCell>{formatDate(row.uploadDate)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm" className="gap-2">
                          <Link href={row.actionHref}>
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="gap-4 border-slate-200 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-2xl font-semibold">Citizen Engagement Pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4">
            <div className="grid grid-cols-3 gap-3">
              <Card className="gap-1 border-slate-200 py-3">
                <CardContent className="px-3">
                  <div className="text-[11px] text-slate-500">New This Week</div>
                  <div className="text-3xl font-semibold text-slate-900">{data.engagementPulse.newThisWeek}</div>
                </CardContent>
              </Card>
              <Card className="gap-1 border-rose-200 bg-rose-50 py-3">
                <CardContent className="px-3">
                  <div className="text-[11px] text-rose-700">Awaiting Reply</div>
                  <div className="text-3xl font-semibold text-rose-700">{data.engagementPulse.awaitingReply}</div>
                </CardContent>
              </Card>
              <Card className="gap-1 border-slate-200 py-3">
                <CardContent className="px-3">
                  <div className="text-[11px] text-slate-500">Moderated</div>
                  <div className="text-3xl font-semibold text-slate-900">{data.engagementPulse.moderated}</div>
                </CardContent>
              </Card>
            </div>

            <LineChartCard
              title="Comments Trend"
              series={{
                data: data.engagementPulse.commentsTrend.map((point) => ({ label: point.label, value: point.value })),
                xKey: "label",
                lines: [{ key: "value", label: "Comments", stroke: "#0f766e" }],
              }}
              showLegend={false}
              showGrid
              height={180}
              emptyText="No comments trend data."
              className="gap-3"
            />

            <BarChartCard
              title="Comment Targets"
              series={{
                data: data.engagementPulse.commentTargets.map((point) => ({ category: point.category, count: point.count })),
                xKey: "category",
                bars: [{ key: "count", label: "Targets", fill: "#2563eb" }],
              }}
              showLegend={false}
              showGrid
              height={190}
              emptyText="No comment target data."
              className="gap-3"
            />

            <Card className="gap-3 border-slate-200 py-4">
              <CardHeader className="px-4">
                <CardTitle className="text-sm font-semibold">Recent Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4">
                {data.recentComments.map((comment) => (
                  <div key={comment.id} className="space-y-3 rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                        <Users className="h-4 w-4 text-slate-500" />
                        <span>{comment.author}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`rounded-full text-[11px] ${
                          comment.replyAvailable
                            ? "border-amber-300 bg-amber-50 text-amber-700"
                            : "border-emerald-300 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {comment.replyAvailable ? "Unreplied" : "Replied"}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500">Commented on: {comment.title}</div>
                    <p className="text-sm text-slate-700">{comment.snippet}</p>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">{comment.timestampLabel}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs text-slate-700"
                        onClick={() => onReply(comment.id)}
                      >
                        Reply
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full gap-2"
                  onClick={onViewAllComments}
                >
                  View All Comments
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      {/* [DBv2] `public.aips` does not currently expose explicit claim/claimed_by fields.
          `Available to Claim` is a UI-only queue metric for now; TODO map this to real assignment data once schema evolves. */}
      <div className="hidden items-center gap-2 text-xs text-slate-400">
        <CalendarDays className="h-3.5 w-3.5" />
        <span>Dashboard snapshot for city scope: {data.scope.psgcCode}</span>
      </div>
    </div>
  );
}
