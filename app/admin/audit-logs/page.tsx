import { AuditView } from "@/features/audit";
import { AUDIT_LOGS_MOCK } from "@/features/audit/mock/auditLogs.mock";
import { mapAuditRecordToActivityLogRow } from "@/features/audit/mappers/audit.mapper";

export default function AuditLogsPage() {
  const logs = AUDIT_LOGS_MOCK.map(mapAuditRecordToActivityLogRow);
  return <AuditView logs={logs} />;
}
