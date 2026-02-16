"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  CalendarDays,
  FolderKanban,
  MessageSquare,
  Search,
  Wallet,
  FileText,
  Eye,
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
import { formatDate, formatNumber, formatPeso } from "@/lib/formatting";
import { getAipStatusBadgeClass } from "@/features/aip/utils";
import { getProjectStatusBadgeClass } from "@/features/projects/utils/status-badges";
import { getAipStatusLabel } from "@/features/submissions/presentation/submissions.presentation";
import type { ProjectCategory } from "@/lib/contracts/databasev2/enums";
import type { BarangayDashboardData } from "../types";
import { useBarangayDashboard } from "../hooks/useBarangayDashboard";

function typeLabel(type: ProjectCategory): string {
  if (type === "health") return "Health";
  if (type === "infrastructure") return "Infrastructure";
  return "Other";
}

function DonutChart({ data }: { data: BarangayDashboardData["budgetBreakdown"] }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const segments = data.map((item, index) => {
    const ratio = total > 0 ? item.amount / total : 0;
    const length = ratio * circumference;
    const offset = data
      .slice(0, index)
      .reduce((sum, current) => sum + (total > 0 ? (current.amount / total) * circumference : 0), 0);

    return {
      ...item,
      ratio,
      length,
      offset,
    };
  });

  return (
    <div className="space-y-3">
      <div className="relative flex h-52 w-52 items-center justify-center">
        <svg width="208" height="208" viewBox="0 0 208 208">
          <g transform="translate(104,104) rotate(-90)">
            {segments.map((segment) => (
              <g key={segment.id} className={segment.colorClass}>
                <circle
                  r={radius}
                  cx={0}
                  cy={0}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth={24}
                  strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                  strokeDashoffset={-segment.offset}
                />
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        {segments.map((segment) => (
          <div key={segment.id} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${segment.colorClass.replace("text", "bg")}`} />
            <span>{segment.label}</span>
            <span className="font-semibold">{Math.round(segment.ratio * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data }: { data: BarangayDashboardData["engagementPulse"]["feedbackTrend"] }) {
  const maxValue = Math.max(...data.map((point) => point.value), 1);
  const width = 520;
  const height = 170;
  const plotWidth = width - 40;
  const plotHeight = height - 40;
  const step = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth;

  const points = data
    .map((point, index) => {
      const x = 20 + index * step;
      const y = 20 + (1 - point.value / maxValue) * plotHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full overflow-x-auto text-teal-700">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <polyline fill="none" stroke="currentColor" strokeWidth={2} points={points} />
        {data.map((point, index) => {
          const x = 20 + index * step;
          const y = 20 + (1 - point.value / maxValue) * plotHeight;
          return (
            <g key={point.label}>
              <circle cx={x} cy={y} r={3.5} fill="currentColor" />
              <text x={x} y={height - 8} textAnchor="middle" className="fill-slate-500 text-[10px]">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function VerticalBarChart({ data }: { data: BarangayDashboardData["engagementPulse"]["feedbackTargets"] }) {
  const maxValue = Math.max(...data.map((point) => point.count), 1);
  const width = 520;
  const height = 190;
  const chartHeight = 130;
  const barSpace = width / Math.max(data.length, 1);
  const barWidth = Math.min(90, barSpace * 0.55);

  return (
    <div className="w-full overflow-x-auto text-blue-500">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {data.map((point, index) => {
          const barHeight = (point.count / maxValue) * chartHeight;
          const x = index * barSpace + (barSpace - barWidth) / 2;
          const y = 20 + (chartHeight - barHeight);

          return (
            <g key={point.label}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx={6} fill="currentColor" />
              <text x={x + barWidth / 2} y={height - 32} textAnchor="middle" className="fill-slate-500 text-[10px]">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function BarangayDashboardView() {
  const {
    filters,
    data,
    isLoading,
    error,
    availableYears,
    totalBudget,
    setYear,
    setSearch,
    setSector,
    setProjectType,
  } = useBarangayDashboard();

  const kpiCards = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "AIP Status",
        value: getAipStatusLabel(data.aipStatus.status),
        subtext: `${data.aipStatus.asOfLabel} · ${data.aipStatus.lastUpdatedLabel}`,
        icon: FileText,
      },
      {
        label: "Total Projects",
        value: formatNumber(data.totalProjects.total),
        subtext: `Health: ${data.totalProjects.healthCount} · Infra: ${data.totalProjects.infrastructureCount}`,
        icon: FolderKanban,
      },
      {
        label: "Total Budget",
        value: formatPeso(totalBudget),
        subtext: `Based on project totals for ${filters.year}`,
        icon: Wallet,
      },
      {
        label: "Citizen Feedback",
        value: `${formatNumber(data.citizenFeedback.totalComments)} Comments`,
        subtext: `${data.citizenFeedback.awaitingReply} awaiting replies`,
        icon: MessageSquare,
      },
    ];
  }, [data, filters.year, totalBudget]);

  const onViewAllProjects = () => {
    console.info("[TODO] /barangay/projects route is not available yet; wire once route exists.");
  };

  if (isLoading && !data) {
    return <div className="text-sm text-slate-500">Loading barangay dashboard...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-rose-600">{error ?? "Unable to load dashboard."}</div>;
  }

  return (
    <div className="space-y-6">
      {/* [DISCOVERY] Reuses the city dashboard composition from `features/city/dashboard/views/city-dashboard-view.tsx`
          and shared shadcn primitives in `components/ui/*` for cards, tables, badges, and selects. */}
      <div className="space-y-1">
        <h1 className="text-4xl font-semibold text-slate-900">Welcome to OpenAIP</h1>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={filters.search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 border-slate-200 bg-slate-50 pl-9"
            placeholder={data.globalSearchPlaceholder}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-slate-500">Year:</span>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const isFeedback = kpi.label === "Citizen Feedback";

          return (
            <Card key={kpi.label} className="gap-3 border-slate-200 py-4">
              <CardContent className="space-y-2 px-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{kpi.label}</span>
                  <Icon className="h-4 w-4 text-slate-500" />
                </div>
                <div className="text-2xl font-semibold text-slate-900">{kpi.value}</div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{kpi.subtext}</span>
                  {isFeedback && data.citizenFeedback.awaitingReply > 0 ? (
                    <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-700">
                      {data.citizenFeedback.actionRequiredLabel}
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="gap-4 border-slate-200 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-sm font-semibold">Budget Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4">
            <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
              <DonutChart data={data.budgetBreakdown} />

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500">Total Budget</div>
                  <div className="text-4xl font-semibold text-teal-800">{formatPeso(totalBudget)}</div>
                </div>

                <div className="rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.budgetBreakdown.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${item.colorClass.replace("text", "bg")}`} />
                              <span>{item.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.percent}%</TableCell>
                          <TableCell className="text-right">{formatPeso(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild className="bg-teal-700 text-white hover:bg-teal-800">
                    <Link href={data.budgetActions.aipDetailsHref}>View AIP Details</Link>
                  </Button>

                  {data.budgetActions.allProjectsHref ? (
                    <Button asChild variant="outline">
                      <Link href={data.budgetActions.allProjectsHref}>View All Projects</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" type="button" onClick={onViewAllProjects}>
                      View All Projects
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden border-slate-200 py-0">
            <CardContent className="bg-linear-to-r from-sky-900 to-blue-500 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="text-5xl font-semibold leading-none">{data.dateCard.day}</div>
                <div>
                  <div className="text-xs font-semibold">{data.dateCard.weekday}</div>
                  <div className="text-xs uppercase tracking-wide">
                    {data.dateCard.month} {data.dateCard.year}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 border-slate-200 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm font-semibold">You&apos;re Working On</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4">
              {data.workingOn.isCaughtUp ? (
                <div className="rounded-lg border border-slate-200 p-4 text-center">
                  <div className="text-lg font-semibold text-teal-800">{data.workingOn.emptyLabel}</div>
                </div>
              ) : (
                data.workingOn.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="text-sm font-medium text-slate-700">{item.title}</div>
                    <Button asChild variant="link" className="h-auto p-0 text-xs text-teal-700">
                      <Link href={item.href}>Open</Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="gap-4 border-slate-200 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-sm font-semibold">Top Funded Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4">
            <div className="grid gap-3 xl:grid-cols-[1fr_170px_170px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={filters.search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-9 border-slate-200 bg-slate-50 pl-9"
                  placeholder="Search projects..."
                />
              </div>

              <Select value={filters.sector} onValueChange={(value) => setSector(value as typeof filters.sector)}>
                <SelectTrigger className="h-9 border-slate-200 bg-slate-50">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                  <SelectItem value="Economic">Economic</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.projectType}
                onValueChange={(value) => setProjectType(value as typeof filters.projectType)}
              >
                <SelectTrigger className="h-9 border-slate-200 bg-slate-50">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topFundedProjects.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.rank}</TableCell>
                      <TableCell className="font-medium text-slate-800">{row.projectName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full border-teal-200 bg-teal-50 text-teal-700">
                          {row.sector}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-sky-700">
                          {typeLabel(row.projectType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatPeso(row.budget)}</TableCell>
                      <TableCell>
                        {/* [DBv2] Project status enum is not yet explicit in `public.projects`; current badge uses existing UI status. */}
                        <Badge variant="outline" className={`rounded-full ${getProjectStatusBadgeClass(row.projectStatus)}`}>
                          {formatStatusLabel(row.projectStatus)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-4 border-slate-200 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-sm font-semibold">Recent Project Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4">
            <div className="max-h-105 space-y-2 overflow-auto pr-1">
              {data.recentProjectUpdates.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                  <div className="text-xs text-slate-500">{typeLabel(item.category)} Program</div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{formatDate(item.date)}</span>
                    <span>{formatNumber(item.attendees)} attendees</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
                  <div className="font-semibold">{data.cityAipStatus.title}</div>
                  <div>{data.cityAipStatus.description}</div>
                </div>
              ) : (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{data.cityAipStatus.title}</span>
                  </div>
                  <div className="mt-1">{data.cityAipStatus.description}</div>
                </div>
              )}

              <Button asChild className="w-full bg-teal-700 text-white hover:bg-teal-800">
                <Link href={data.cityAipStatus.ctaHref}>Upload City AIP for {filters.year}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="gap-4 border-slate-200 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm font-semibold">Publication Timeline</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-3 gap-4">
                {data.publicationTimeline.map((item) => (
                  <div key={item.year} className="space-y-2 text-center">
                    <div className="mx-auto flex h-32 w-full max-w-30 items-end rounded bg-slate-100 p-2">
                      <div
                        className="w-full rounded bg-emerald-500"
                        style={{ height: `${Math.max(item.publishedCount * 32, 24)}px` }}
                      />
                    </div>
                    <div className="text-xs text-slate-500">{item.year}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                        {/* [DBv2] Using enum values exactly from `public.aip_status` (draft/pending_review/under_review/for_revision/published). */}
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

          <Card className="gap-4 border-slate-200 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4">
              {data.recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{item.action}</div>
                    <div className="text-xs text-slate-500">{item.timestamp}</div>
                  </div>
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-600">
                    {item.tag}
                  </Badge>
                </div>
              ))}

              <Button asChild variant="outline" className="w-full">
                <Link href="/barangay/audit">View Audit and Accountability</Link>
              </Button>
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
                  <div className="text-[11px] text-slate-500">Hidden</div>
                  <div className="text-3xl font-semibold text-slate-900">{data.engagementPulse.hidden}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="gap-3 border-slate-200 py-4">
              <CardHeader className="px-4">
                <CardTitle className="text-sm font-semibold">Feedback Trend</CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <LineChart data={data.engagementPulse.feedbackTrend} />
              </CardContent>
            </Card>

            <Card className="gap-3 border-slate-200 py-4">
              <CardHeader className="px-4">
                <CardTitle className="text-sm font-semibold">Feedback Targets</CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <VerticalBarChart data={data.engagementPulse.feedbackTargets} />
              </CardContent>
            </Card>

            <Card className="gap-3 border-slate-200 py-4">
              <CardHeader className="px-4">
                <CardTitle className="text-sm font-semibold">Recent Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4">
                {data.recentFeedback.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    No recent feedback items.
                  </div>
                ) : (
                  data.recentFeedback.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.subtitle}</div>
                      <div className="mt-1 text-[11px] text-slate-500">{formatDate(item.date)}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      {/* [DBv2] Current enum in codebase includes only: draft, pending_review, under_review, for_revision, published.
          If DB adds approved/rejected later, extend `lib/contracts/databasev2/enums.ts` and the status helpers first. */}
      <div className="hidden items-center gap-2 text-xs text-slate-400">
        <CalendarDays className="h-3.5 w-3.5" />
        <span>{data.scope.barangayName} dashboard snapshot ({data.scope.role})</span>
      </div>
    </div>
  );
}

function formatStatusLabel(status: string): string {
  return status
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
