"use client";

import { useEffect, useMemo, useState } from "react";
import { getAccountsRepo } from "@/lib/repos/accounts";
import type {
  AccountRecord,
  AccountRole,
  AccountStatus,
  AccountTab,
} from "@/lib/repos/accounts";

export type OpenModal =
  | "details"
  | "deactivate"
  | "suspend"
  | "reset_password"
  | "force_logout"
  | "activate"
  | null;

export type RoleFilter = "all" | AccountRole;
export type StatusFilter = "all" | AccountStatus;
export type LguFilter = "all" | string;

export function useAccountAdministration() {
  const repo = useMemo(() => getAccountsRepo(), []);

  const [activeTab, setActiveTab] = useState<AccountTab>("officials");
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [lguFilter, setLguFilter] = useState<LguFilter>("all");

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<OpenModal>(null);

  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionEndDate, setSuspensionEndDate] = useState("");

  useEffect(() => {
    let isActive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await repo.list(activeTab);
        if (!isActive) return;
        setAccounts(rows);
      } catch (err) {
        if (!isActive) return;
        setError(
          err instanceof Error ? err.message : "Failed to load accounts."
        );
      } finally {
        if (isActive) setLoading(false);
      }
    }

    load();
    return () => {
      isActive = false;
    };
  }, [repo, activeTab]);

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return accounts.find((row) => row.id === selectedAccountId) ?? null;
  }, [accounts, selectedAccountId]);

  const roleOptions = useMemo(() => {
    const set = new Set<AccountRole>();
    accounts.forEach((row) => set.add(row.role));
    return Array.from(set);
  }, [accounts]);

  const lguOptions = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach((row) => {
      if (row.lguAssignment && row.lguAssignment !== "—") set.add(row.lguAssignment);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((row) => {
      if (roleFilter !== "all" && row.role !== roleFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (lguFilter !== "all" && row.lguAssignment !== lguFilter) return false;

      if (!q) return true;
      return (
        row.fullName.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q)
      );
    });
  }, [accounts, query, roleFilter, statusFilter, lguFilter]);

  function closeModal() {
    setOpenModal(null);
  }

  function openFor(id: string, modal: Exclude<OpenModal, null>) {
    setSelectedAccountId(id);
    setOpenModal(modal);
    if (modal !== "suspend") {
      setSuspensionReason("");
      setSuspensionEndDate("");
    }
  }

  async function applyStatus(id: string, status: AccountStatus) {
    const updated = await repo.setStatus(id, status, { kind: "none" });
    setAccounts((prev) => prev.map((row) => (row.id === id ? updated : row)));
    return updated;
  }

  async function deactivateSelected() {
    if (!selectedAccount) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await repo.setStatus(selectedAccount.id, "deactivated", {
        kind: "none",
      });
      setAccounts((prev) =>
        prev.map((row) => (row.id === selectedAccount.id ? updated : row))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to deactivate account."
      );
    } finally {
      setLoading(false);
      closeModal();
    }
  }

  async function activateSelected() {
    if (!selectedAccount) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await repo.setStatus(selectedAccount.id, "active", {
        kind: "none",
      });
      setAccounts((prev) =>
        prev.map((row) => (row.id === selectedAccount.id ? updated : row))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to activate account."
      );
    } finally {
      setLoading(false);
      closeModal();
    }
  }

  async function suspendSelected() {
    if (!selectedAccount) return;
    setLoading(true);
    setError(null);
    try {
      const reason = suspensionReason.trim();
      const updated = await repo.setStatus(selectedAccount.id, "suspended", {
        kind: "suspension",
        reason,
        endDate: suspensionEndDate.trim() ? suspensionEndDate.trim() : undefined,
      });
      setAccounts((prev) =>
        prev.map((row) => (row.id === selectedAccount.id ? updated : row))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to suspend account."
      );
    } finally {
      setLoading(false);
      closeModal();
    }
  }

  async function resetPasswordSelected() {
    if (!selectedAccount) return;
    setLoading(true);
    setError(null);
    try {
      await repo.resetPassword(selectedAccount.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset password."
      );
    } finally {
      setLoading(false);
      closeModal();
    }
  }

  async function forceLogoutSelected() {
    if (!selectedAccount) return;
    setLoading(true);
    setError(null);
    try {
      await repo.forceLogout(selectedAccount.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to force logout."
      );
    } finally {
      setLoading(false);
      closeModal();
    }
  }

  return {
    activeTab,
    setActiveTab,

    accounts,
    filteredAccounts,
    loading,
    error,

    query,
    setQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    lguFilter,
    setLguFilter,
    roleOptions,
    lguOptions,

    selectedAccount,
    openModal,
    setOpenModal,
    closeModal,
    openFor,

    suspensionReason,
    setSuspensionReason,
    suspensionEndDate,
    setSuspensionEndDate,

    deactivateSelected,
    activateSelected,
    suspendSelected,
    resetPasswordSelected,
    forceLogoutSelected,
  };
}
