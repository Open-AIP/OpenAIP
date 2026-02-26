import { AuditView } from "@/features/audit";
import { getAuditFeed } from "@/lib/repos/audit/queries";

export default async function AuditLogsPage() {
  const logs = await getAuditFeed();
  return <AuditView logs={logs} />;
}
