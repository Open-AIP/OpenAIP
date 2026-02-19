import { ACCOUNTS_TABLE } from "@/mocks/fixtures/accounts/accounts.table.fixture";
import type {
  AccountListInput,
  AccountListResult,
  AccountRecord,
  AccountsRepo,
  AccountStatus,
  AccountTab,
  CreateOfficialAccountInput,
  LguOption,
  UpdateAccountInput,
} from "./repo";

function roleOptionsForTab(tab: AccountTab) {
  if (tab === "citizens") return ["citizen"] as const;
  return [
    "admin",
    "barangay_official",
    "city_official",
    "municipal_official",
  ] as const;
}

function toLguOption(row: AccountRecord): LguOption | null {
  if (!row.lguScopeId || row.lguScopeType === "none") return null;
  return {
    key: `${row.lguScopeType}:${row.lguScopeId}`,
    scopeType: row.lguScopeType,
    id: row.lguScopeId,
    label: row.lguAssignment,
    isActive: true,
  };
}

export function createMockAccountsRepoImpl(): AccountsRepo {
  // Create a local copy to prevent test pollution.
  const localAccountsTable = ACCOUNTS_TABLE.map((row) => ({ ...row }));

  function getOrThrow(id: string) {
    const idx = localAccountsTable.findIndex((row) => row.id === id);
    if (idx === -1) throw new Error(`Account not found: ${id}`);
    return { idx, row: localAccountsTable[idx] };
  }

  function normalizeListInput(input: AccountListInput): Required<AccountListInput> {
    return {
      tab: input.tab,
      query: input.query ?? "",
      role: input.role ?? "all",
      status: input.status ?? "all",
      lguKey: input.lguKey ?? "all",
      page: Math.max(1, input.page ?? 1),
      pageSize: Math.min(100, Math.max(5, input.pageSize ?? 10)),
    };
  }

  return {
    async list(input: AccountListInput): Promise<AccountListResult> {
      const normalized = normalizeListInput(input);
      const q = normalized.query.trim().toLowerCase();

      const filtered = localAccountsTable.filter((row) => {
        if (row.tab !== normalized.tab) return false;
        if (normalized.role !== "all" && row.role !== normalized.role) return false;
        if (normalized.status !== "all" && row.status !== normalized.status) return false;

        if (normalized.lguKey !== "all") {
          const rowKey =
            row.lguScopeType === "none" || !row.lguScopeId
              ? ""
              : `${row.lguScopeType}:${row.lguScopeId}`;
          if (rowKey !== normalized.lguKey) return false;
        }

        if (!q) return true;
        return (
          row.fullName.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q)
        );
      });

      const start = (normalized.page - 1) * normalized.pageSize;
      const rows = filtered.slice(start, start + normalized.pageSize);

      const lguOptionsMap = new Map<string, LguOption>();
      filtered.forEach((row) => {
        const option = toLguOption(row);
        if (!option) return;
        lguOptionsMap.set(option.key, option);
      });

      return {
        rows,
        total: filtered.length,
        page: normalized.page,
        pageSize: normalized.pageSize,
        roleOptions: [...roleOptionsForTab(normalized.tab)],
        lguOptions: Array.from(lguOptionsMap.values()).sort((a, b) =>
          a.label.localeCompare(b.label)
        ),
      };
    },

    async createOfficial(input: CreateOfficialAccountInput): Promise<AccountRecord> {
      const now = new Date().toISOString();
      const roleLabel =
        input.role === "city_official"
          ? "City"
          : input.role === "municipal_official"
            ? "Municipality"
            : "Barangay";

      const record: AccountRecord = {
        id: `mock_${Math.random().toString(36).slice(2, 12)}`,
        tab: "officials",
        fullName: input.fullName,
        email: input.email,
        role: input.role,
        status: "active",
        isActive: true,
        lguScopeType: input.scopeType,
        lguScopeId: input.scopeId,
        lguAssignment: `${roleLabel} (${input.scopeId})`,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
        invitedAt: now,
        emailConfirmedAt: null,
        invitationPending: true,
        canResendInvite: true,
      };

      localAccountsTable.unshift(record);
      return record;
    },

    async updateAccount(id: string, patch: UpdateAccountInput): Promise<AccountRecord> {
      const { idx, row } = getOrThrow(id);
      const next: AccountRecord = {
        ...row,
        fullName: patch.fullName.trim(),
        role: patch.role,
        lguScopeType: patch.scopeType,
        lguScopeId: patch.scopeId,
        lguAssignment:
          patch.scopeType === "none" || !patch.scopeId
            ? "System-wide"
            : `${patch.scopeType[0].toUpperCase()}${patch.scopeType.slice(1)} (${patch.scopeId})`,
        tab: patch.role === "citizen" ? "citizens" : "officials",
        updatedAt: new Date().toISOString(),
      };

      localAccountsTable[idx] = next;
      return next;
    },

    async setStatus(id: string, status: AccountStatus): Promise<AccountRecord> {
      const { idx, row } = getOrThrow(id);
      const next: AccountRecord = {
        ...row,
        status,
        isActive: status === "active",
        updatedAt: new Date().toISOString(),
        canResendInvite: status === "active" && row.invitationPending,
      };
      localAccountsTable[idx] = next;
      return next;
    },

    async deleteAccount(id: string): Promise<void> {
      const { idx } = getOrThrow(id);
      localAccountsTable.splice(idx, 1);
    },

    async resetPassword(id: string): Promise<void> {
      const { row } = getOrThrow(id);
      console.log(`[mock] resetPassword -> ${row.email}`);
    },

    async resendInvite(id: string): Promise<void> {
      const { idx, row } = getOrThrow(id);
      if (!row.isActive) {
        throw new Error("Cannot resend invite for a deactivated account.");
      }
      localAccountsTable[idx] = {
        ...row,
        invitedAt: new Date().toISOString(),
        invitationPending: true,
        canResendInvite: true,
      };
    },
  };
}
