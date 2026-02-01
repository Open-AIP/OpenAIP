import AipManagementView from "@/features/aip/views/aip-management-view";
import { createMockAipRepo } from "@/features/aip/services/aip-repo.mock";

const BarangayAIPS = async () => {
  const aipRepo = createMockAipRepo({ defaultScope: "barangay" });
  const records = await aipRepo.listVisibleAips({ scope: "barangay", visibility: "my" });
  return <AipManagementView scope="barangay" records={records} />;
};

export default BarangayAIPS;
