import AipManagementView from "@/features/aip/views/aip-management-view";
import { createMockAipRepo } from "@/features/aip/services/aip-repo.mock";

const CityAIPS = async () => {
  const aipRepo = createMockAipRepo({ defaultScope: "city" });
  const records = await aipRepo.listVisibleAips({ scope: "city", visibility: "my" });
  return <AipManagementView scope="city" records={records} />;
};

export default CityAIPS;
