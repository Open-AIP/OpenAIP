"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import { AIPS_TABLE } from "@/features/aip/mock/aips.table";
import AipDetailView from "@/features/aip/views/aip-detail-view";
import { generateMockAIP } from "@/features/aip/services/mock-aip-generator";

export default function CityAipDetailPage({
  params,
}: {
  params: Promise<{ aipId: string }>;
}) {
  const { aipId } = use(params);

  // Check if it's an existing AIP
  let aip = AIPS_TABLE.find((x) => x.id === aipId && x.scope === "city");
  
  // If not found and it's a mock upload (starts with 'aip-'), generate mock data
  if (!aip && aipId.startsWith("aip-")) {
    // Extract year from aipId (format: aip-{year}-{name}-{timestamp})
    const yearMatch = aipId.match(/aip-(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    const fileName = aipId.split("-").slice(2, -1).join("-") + ".pdf";
    
    aip = generateMockAIP(aipId, fileName, year, "city");
  }
  
  if (!aip) return notFound();

  return (
    <AipDetailView 
      aip={aip} 
      scope="city"
      onSubmit={() => {
        console.log("Submitting AIP for review:", aipId);
        // In a real app, this would update the status to pending_review
        // For now, just log it
      }}
      onCancel={() => {
        console.log("Canceling AIP draft:", aipId);
        // In a real app, this would delete the draft or navigate away
      }}
    />
  );
}
