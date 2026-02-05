import AuditView from "@/features/audit/audit-view";
import { getAuditFeed } from "@/features/audit/services/auditService";

export default async function CityAudit() {
  const logs = await getAuditFeed();
  return <AuditView logs={logs} />;
}
