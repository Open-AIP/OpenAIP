import AuditView from "@/feature/audit/audit-view";
import { MOCK_AUDIT_LOGS } from "@/mock/audit";

export default function CityAudit() {
  const logs = MOCK_AUDIT_LOGS.filter((x) => x.scope === "city");
  return <AuditView logs={logs} />;
}
