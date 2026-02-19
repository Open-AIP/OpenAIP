import { AuditView } from "@/features/audit";
import { getAuditFeed } from "@/lib/repos/audit/queries";

export default async function BarangayAudit() {
  const logs = await getAuditFeed();
  return <AuditView logs={logs} />;
}
