/**
 * AIP Card Component
 * 
 * Displays a summary card for an Annual Investment Plan (AIP) record.
 * Shows key information including title, description, budget, year, status,
 * and upload/publish dates. The card is clickable and navigates to the detail view.
 * 
 * @module feature/aips/aip-card
 */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AipHeader } from "../types";
import { CalendarDays, PhilippinePeso } from "lucide-react";
import { formatPeso } from "@/lib/utils/formatting";
import { getAipStatusBadgeClass } from "../utils";

/**
 * AipCard Component
 * 
 * Renders a clickable card displaying AIP summary information.
 * Supports both city and barangay scope for proper routing.
 * 
 * @param aip - The AIP record to display
 * @param scope - The administrative scope (city or barangay) for routing
 */
export default function AipCard({ 
  aip, 
  scope = "barangay" 
}: { 
  aip: AipHeader;
  scope?: "city" | "barangay";
}) {
  return (
    <Link href={`/${scope}/aips/${aip.id}`} className="block">
      <Card className="border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 hover:text-[#022437] transition-colors">
                {aip.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{aip.description}</p>

              <div className="mt-4 flex flex-wrap items-center gap-x-10 gap-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <span>AIP Year: {aip.year}</span>
                </div>

                <div className="flex items-center gap-2">
                  <PhilippinePeso className="h-4 w-4 text-slate-400" />
                  <span>
                    Budget: <span className="font-semibold text-[#022437]">{formatPeso(aip.budget)}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Uploaded:</span>
                  <span>{aip.uploadedAt}</span>
                </div>

                {aip.publishedAt ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Published:</span>
                    <span>{aip.publishedAt}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <Badge variant="outline" className={`rounded-full ${getAipStatusBadgeClass(aip.status)}`}>
              {aip.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
