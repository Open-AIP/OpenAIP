import AipManagementView from "@/feature/aips/aip-management-view";
import { MOCK_AIPS } from "@/mock/aips";

const CityAIPS = () => {
  const records = MOCK_AIPS.filter((x) => x.scope === "city");
  return <AipManagementView records={records} scope="city" />;
}

export default CityAIPS