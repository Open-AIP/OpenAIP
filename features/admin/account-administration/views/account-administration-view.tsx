"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AccountAdminHeader from "../components/account-admin-header";
import AccountFilters from "../components/account-filters";
import AccountTabs from "../components/account-tabs";
import AccountsTable from "../components/accounts-table";
import ActivateAccountModal from "../components/modals/activate-account-modal";
import AccountDetailsModal from "../components/modals/account-details-modal";
import DeactivateAccountModal from "../components/modals/deactivate-account-modal";
import ForceLogoutModal from "../components/modals/force-logout-modal";
import ResetPasswordModal from "../components/modals/reset-password-modal";
import SuspendAccountModal from "../components/modals/suspend-account-modal";
import { useAccountAdministration } from "../hooks/use-account-administration";

export default function AccountAdministrationView() {
  const {
    activeTab,
    setActiveTab,

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
  } = useAccountAdministration();

  const [createOfficialOpen, setCreateOfficialOpen] = useState(false);

  return (
    <div className="space-y-6">
      <AccountAdminHeader onCreateOfficial={() => setCreateOfficialOpen(true)} />

      <AccountTabs value={activeTab} onChange={setActiveTab} />

      <AccountFilters
        query={query}
        onQueryChange={setQuery}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        lguFilter={lguFilter}
        onLguChange={setLguFilter}
        roleOptions={roleOptions}
        lguOptions={lguOptions}
      />

      {loading ? (
        <div className="text-sm text-slate-500">Loading accounts...</div>
      ) : error ? (
        <div className="text-sm text-rose-600">{error}</div>
      ) : (
        <AccountsTable
          tab={activeTab}
          rows={filteredAccounts}
          onViewDetails={(id) => openFor(id, "details")}
          onDeactivate={(id) => openFor(id, "deactivate")}
          onSuspend={(id) => openFor(id, "suspend")}
          onResetPassword={(id) => openFor(id, "reset_password")}
          onForceLogout={(id) => openFor(id, "force_logout")}
          onActivateOrReactivate={(id) => openFor(id, "activate")}
        />
      )}

      <AccountDetailsModal
        open={openModal === "details"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        account={selectedAccount}
      />

      <DeactivateAccountModal
        open={openModal === "deactivate"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        account={selectedAccount}
        onConfirm={deactivateSelected}
      />

      <SuspendAccountModal
        open={openModal === "suspend"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        account={selectedAccount}
        reason={suspensionReason}
        onReasonChange={setSuspensionReason}
        endDate={suspensionEndDate}
        onEndDateChange={setSuspensionEndDate}
        onConfirm={suspendSelected}
      />

      <ResetPasswordModal
        open={openModal === "reset_password"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        account={selectedAccount}
        onConfirm={resetPasswordSelected}
      />

      <ForceLogoutModal
        open={openModal === "force_logout"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        account={selectedAccount}
        onConfirm={forceLogoutSelected}
      />

      <ActivateAccountModal
        open={openModal === "activate"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        account={selectedAccount}
        onConfirm={activateSelected}
      />

      <Dialog open={createOfficialOpen} onOpenChange={setCreateOfficialOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Official Account</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-slate-500">Not implemented yet.</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

