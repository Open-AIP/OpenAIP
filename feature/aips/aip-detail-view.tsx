"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, RotateCw, X } from "lucide-react";

import type { AipDetail } from "@/types";
import { canEditAip } from "@/feature/aips/utils";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { getAipStatusBadgeClass } from "@/lib/utils/ui-helpers";

import { AipPdfContainer } from "@/feature/aips/components/aip-pdf-container";
import { AipDetailsSummary } from "@/feature/aips/components/aip-details-summary";
import { AipProjectsTable } from "@/feature/aips/components/aip-projects-table";
import { AipUploaderInfo } from "@/feature/aips/components/aip-uploader-info";

export default function AipDetailView({
  aip,
  scope = "barangay",
  onEdit,
  onResubmit,
  onCancel,
}: {
  aip: AipDetail;
  scope?: "city" | "barangay";
  onEdit?: () => void;
  onResubmit?: () => void;
  onCancel?: () => void;
}) {
  const editable = canEditAip(aip.status);
  const showFeedback = aip.status === "For Revision";

  const breadcrumb = [
    { label: "AIP Management", href: `/${scope}/aips` },
    { label: aip.title, href: "#" },
  ];

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={breadcrumb} />

      {/* title bar */}
      <Card className="border-slate-200">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {aip.title} <span className="ml-2">{aip.year}</span>
          </h1>

          <Badge variant="outline" className={`rounded-full ${getAipStatusBadgeClass(aip.status)}`}>
            {aip.status}
          </Badge>
        </CardContent>
      </Card>

      <AipPdfContainer aip={aip} />

      <AipDetailsSummary aip={aip} scope={scope} />

      <AipProjectsTable aip={aip} />

      <AipUploaderInfo aip={aip} />

      {/* Bottom action */}
      <div className="flex justify-end gap-3">
        {showFeedback && (
          <>
            <Button variant="outline" onClick={onEdit} disabled={!onEdit}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={onResubmit} disabled={!onResubmit}>
              <RotateCw className="h-4 w-4" />
              Resubmit
            </Button>
          </>
        )}

        {aip.status === "Draft" && (
          <Button variant="destructive" onClick={onCancel} disabled={!onCancel}>
            <X className="h-4 w-4" />
            Cancel Submission
          </Button>
        )}
      </div>
    </div>
  );
}
