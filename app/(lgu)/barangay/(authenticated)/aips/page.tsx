import AipManagementView from "@/features/aip/views/aip-management-view";
import { getAipRepo } from "@/features/aip/services/aip-repo.selector";

const BarangayAIPS = async () => {
  const aipRepo = getAipRepo({ defaultScope: "barangay" });
  const records = await aipRepo.listVisibleAips({ scope: "barangay", visibility: "my" });
  return <AipManagementView scope="barangay" records={records} />;
};

export default BarangayAIPS;
