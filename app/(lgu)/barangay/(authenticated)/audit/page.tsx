import AuditView from "@/feature/audit/audit-view";
import { MOCK_AUDIT_LOGS } from "@/mock/audit";

export default function BarangayAudit() {
  const logs = MOCK_AUDIT_LOGS.filter((x) => x.scope === "barangay");
  return <AuditView logs={logs} />;
}
