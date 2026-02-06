import AipManagementView from "@/features/aip/views/aip-management-view";
import { getAipRepo } from "@/features/aip/services/aip-repo.selector";

const CityAIPS = async () => {
  const aipRepo = getAipRepo({ defaultScope: "city" });
  const records = await aipRepo.listVisibleAips({ scope: "city", visibility: "my" });
  return <AipManagementView scope="city" records={records} />;
};

export default CityAIPS;
