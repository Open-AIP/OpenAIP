import { notFound } from "next/navigation";
import AipDetailView from "@/features/aip/views/aip-detail-view";
import { getAipRepo } from "@/features/aip/services/aip-repo.selector";
import { getAipProjectRepo } from "@/features/aip/services/aip-project-repo.selector";

export default async function BarangayAipDetail({
  params,
}: {
  params: { aipId: string };
}) {
  const { aipId } = params;

  const aipRepo = getAipRepo({ defaultScope: "barangay" });
  const projectRepo = getAipProjectRepo();
  const aip = await aipRepo.getAipDetail(aipId);

  if (!aip || aip.scope !== "barangay") return notFound();

  return (
    <AipDetailView 
      aip={aip} 
      scope="barangay"
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
