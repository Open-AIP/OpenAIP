import { AuditView } from "@/features/audit";
import { AUDIT_LOGS_MOCK } from "@/features/audit/mock/auditLogs.mock";
import { mapAuditRecordToActivityLogRow } from "@/lib/mappers/audit";

export default function AuditLogsPage() {
  const logs = AUDIT_LOGS_MOCK.map(mapAuditRecordToActivityLogRow);
  return <AuditView logs={logs} />;
}
