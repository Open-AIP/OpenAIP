"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import AipDetailView from "@/features/aip/views/aip-detail-view";
import { getAipRepo } from "@/features/aip/services/aip-repo.selector";

export default function CityAipDetailPage({
  params,
}: {
  params: Promise<{ aipId: string }>;
}) {
  const { aipId } = use(params);

  const aipRepo = getAipRepo({ defaultScope: "city" });
  const aip = use(aipRepo.getAipDetail(aipId));

  if (!aip || aip.scope !== "city") return notFound();

  return <AipDetailView aip={aip} scope="city" />;
}
