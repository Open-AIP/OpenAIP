"use client";

import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AipDetails, AipProjectDetails } from "@/features/citizen/aips/types";
import { formatCurrency } from "@/features/citizen/aips/data/aips.data";
import { FeedbackThread } from "@/features/projects/shared/feedback";

function LabelValue({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-800">{value?.trim() || "N/A"}</p>
    </div>
  );
}

export default function CitizenAipProjectDetailView({
  aip,
  project,
}: {
  aip: AipDetails;
  project: AipProjectDetails;
}) {
  return (
    <section className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "AIPs", href: "/aips" },
          { label: `FY ${aip.fiscalYear}`, href: `/aips/${encodeURIComponent(aip.id)}` },
          { label: `Project ${project.projectRefCode}` },
        ]}
      />

      <Card className="border-slate-200">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                AIP Project Detail
              </p>
              <CardTitle className="text-3xl text-slate-900">{project.title}</CardTitle>
              <p className="text-sm text-slate-600">{aip.lguLabel} • FY {aip.fiscalYear}</p>
            </div>

            <div className="flex gap-2">
              <Badge variant="outline">{project.projectRefCode}</Badge>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 capitalize">
                {project.category}
              </Badge>
              <Badge className="bg-[#5ba6cb] text-white">{project.sector}</Badge>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-700">{project.description}</p>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <LabelValue label="Implementing Agency" value={project.implementingAgency} />
          <LabelValue label="Source of Funds" value={project.sourceOfFunds} />
          <LabelValue label="Expected Output" value={project.expectedOutput} />
          <LabelValue
            label="Total Amount"
            value={Number.isFinite(project.totalAmount) ? formatCurrency(project.totalAmount) : null}
          />
          <LabelValue label="Start Date" value={project.startDate} />
          <LabelValue label="Completion Date" value={project.completionDate} />
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-900">Project Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <FeedbackThread projectId={project.projectId} />
        </CardContent>
      </Card>
    </section>
  );
}
