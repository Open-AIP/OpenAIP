import AipManagementView from "@/feature/aips/aip-management-view";
import { MOCK_AIPS } from "@/mock/aips";

const BarangayAIPS = () => {
  const records = MOCK_AIPS.filter((x) => x.scope === "barangay");
  return <AipManagementView records={records} />;
}

export default BarangayAIPS