import { AipManagementView } from "@/features/aip";
import { getAipRepo } from "@/lib/repos/aip/repo.server";

const CityAIPS = async () => {
  const aipRepo = getAipRepo({ defaultScope: "city" });
  const records = await aipRepo.listVisibleAips({ scope: "city", visibility: "my" });
  return <AipManagementView scope="city" records={records} />;
};

export default CityAIPS;
