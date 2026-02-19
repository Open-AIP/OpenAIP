import { AipManagementView } from "@/features/aip";
import { getAipRepo } from "@/lib/repos/aip/repo.server";

const BarangayAIPS = async () => {
  const aipRepo = getAipRepo({ defaultScope: "barangay" });
  const records = await aipRepo.listVisibleAips({ scope: "barangay", visibility: "my" });
  return <AipManagementView scope="barangay" records={records} />;
};

export default BarangayAIPS;
