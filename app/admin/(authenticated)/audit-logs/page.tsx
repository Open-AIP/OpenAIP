import { AuditView } from "@/features/audit";
import { mapAuditRecordToActivityLogRow } from "@/lib/mappers/audit";
import { AUDIT_LOGS_FIXTURE } from "@/mocks/fixtures/audit/audit-logs.fixture";

export default function AuditLogsPage() {
  const logs = AUDIT_LOGS_FIXTURE.map(mapAuditRecordToActivityLogRow);
  return <AuditView logs={logs} />;
}
