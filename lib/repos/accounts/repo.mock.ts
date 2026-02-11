import { ACCOUNTS_TABLE } from "@/lib/fixtures/accounts/accounts.table.fixture";
import type {
  AccountRecord,
  AccountsRepo,
  AccountStatus,
  AccountTab,
  SetStatusMeta,
} from "./repo";

export function createMockAccountsRepoImpl(): AccountsRepo {
  // Create a local copy to prevent test pollution
  const localAccountsTable = ACCOUNTS_TABLE.map((row) => ({ ...row }));

  function getOrThrow(id: string) {
    const idx = localAccountsTable.findIndex((row) => row.id === id);
    if (idx === -1) throw new Error(`Account not found: ${id}`);
    return { idx, row: localAccountsTable[idx] };
  }

  return {
    async list(tab: AccountTab): Promise<AccountRecord[]> {
      return localAccountsTable.filter((row) => row.tab === tab).slice();
    },

    async setStatus(
      id: string,
      status: AccountStatus,
      meta: SetStatusMeta = { kind: "none" }
    ): Promise<AccountRecord> {
      const { idx, row } = getOrThrow(id);

      const next: AccountRecord = {
        ...row,
        status,
      };

      if (status === "suspended" && meta.kind === "suspension") {
        next.suspensionReason = meta.reason;
        next.suspensionEndDate = meta.endDate ?? "";
      } else {
        next.suspensionReason = "";
        next.suspensionEndDate = "";
      }

      localAccountsTable[idx] = next;
      return next;
    },

    async resetPassword(id: string) {
      const { row } = getOrThrow(id);
      console.log(`[mock] resetPassword -> ${row.email}`);
    },

    async forceLogout(id: string) {
      const { row } = getOrThrow(id);
      console.log(`[mock] forceLogout -> ${row.fullName} (${row.email})`);
    },
  };
}

