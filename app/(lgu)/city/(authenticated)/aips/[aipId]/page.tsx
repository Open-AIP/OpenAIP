"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import AipDetailView from "@/features/aip/views/aip-detail-view";
import { getAipRepo } from "@/features/aip/services/aip-repo.selector";
import { getAipProjectRepo } from "@/features/aip/services/aip-project-repo.selector";

export default function CityAipDetailPage({
  params,
}: {
  params: Promise<{ aipId: string }>;
}) {
  const { aipId } = use(params);

  const aipRepo = getAipRepo({ defaultScope: "city" });
  const projectRepo = getAipProjectRepo();
  const aip = use(aipRepo.getAipDetail(aipId));

  if (!aip || aip.scope !== "city") return notFound();

  return (
    <AipDetailView 
      aip={aip} 
      scope="city"
      projectRepo={projectRepo}
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
