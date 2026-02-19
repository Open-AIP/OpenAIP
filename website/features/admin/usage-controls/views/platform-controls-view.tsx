"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PlatformControlsTabs, {
  PlatformControlsTab,
} from "../components/PlatformControlsTabs";
import CommentRateLimitsCard from "../components/CommentRateLimitsCard";
import FlaggedUsersTable from "../components/FlaggedUsersTable";
import UserAuditHistoryDialog from "../components/UserAuditHistoryDialog";
import BlockUserDialog from "../components/BlockUserDialog";
import UnblockUserDialog from "../components/UnblockUserDialog";
import ChatbotMetricsRow from "../components/ChatbotMetricsRow";
import ChatbotRateLimitsCard from "../components/ChatbotRateLimitsCard";
import ChatbotPolicyCard from "../components/ChatbotPolicyCard";
import { getUsageControlsRepo } from "@/lib/repos/usage-controls/repo";
import type {
  AuditEntryVM,
  ChatbotMetrics,
  ChatbotRateLimitPolicy,
  ChatbotSystemPolicy,
  FlaggedUserRowVM,
  RateLimitSettingsVM,
} from "@/lib/repos/usage-controls/types";

export default function PlatformControlsView() {
  const repo = useMemo(() => getUsageControlsRepo(), []);
  const [activeTab, setActiveTab] = useState<PlatformControlsTab>("feedback");

  const [rateSettings, setRateSettings] = useState<RateLimitSettingsVM | null>(null);
  const [flaggedUsers, setFlaggedUsers] = useState<FlaggedUserRowVM[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntryVM[]>([]);
  const [selectedUser, setSelectedUser] = useState<FlaggedUserRowVM | null>(null);
  const [activeModal, setActiveModal] = useState<"audit" | "block" | "unblock" | null>(null);
  const [chatbotMetrics, setChatbotMetrics] = useState<ChatbotMetrics | null>(null);
  const [chatbotRateLimit, setChatbotRateLimit] = useState<ChatbotRateLimitPolicy | null>(null);
  const [chatbotPolicy, setChatbotPolicy] = useState<ChatbotSystemPolicy | null>(null);

  const [blockReason, setBlockReason] = useState("");
  const [blockDurationValue, setBlockDurationValue] = useState(7);
  const [blockDurationUnit, setBlockDurationUnit] = useState<"days" | "weeks">("days");
  const [unblockReason, setUnblockReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settings, users, metrics, rateLimitPolicy, systemPolicy] = await Promise.all([
        repo.getRateLimitSettings(),
        repo.listFlaggedUsers(),
        repo.getChatbotMetrics(),
        repo.getChatbotRateLimitPolicy(),
        repo.getChatbotSystemPolicy(),
      ]);
      setRateSettings(settings);
      setFlaggedUsers(users);
      setChatbotMetrics(metrics);
      setChatbotRateLimit(rateLimitPolicy);
      setChatbotPolicy(systemPolicy);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load platform controls.");
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSaveRateLimits = async (input: {
    maxComments: number;
    timeWindow: "hour" | "day";
  }) => {
    const next = await repo.updateRateLimitSettings(input);
    setRateSettings(next);
  };

  const handleSaveChatbotRateLimits = async (input: {
    maxRequests: number;
    timeWindow: "per_hour" | "per_day";
  }) => {
    const next = await repo.updateChatbotRateLimitPolicy(input);
    setChatbotRateLimit(next);
  };

  const handleSaveChatbotPolicy = async (input: {
    isEnabled: boolean;
    retentionDays: number;
    userDisclaimer: string;
  }) => {
    const next = await repo.updateChatbotSystemPolicy(input);
    setChatbotPolicy(next);
  };

  const handleViewAudit = async (row: FlaggedUserRowVM) => {
    setSelectedUser(row);
    const entries = await repo.getUserAuditHistory(row.userId);
    setAuditEntries(entries);
    setActiveModal("audit");
  };

  const handleBlockUser = (row: FlaggedUserRowVM) => {
    setSelectedUser(row);
    setBlockReason("");
    setBlockDurationValue(7);
    setBlockDurationUnit("days");
    setAuditEntries([]);
    setActiveModal("block");
  };

  const handleUnblockUser = (row: FlaggedUserRowVM) => {
    setSelectedUser(row);
    setUnblockReason("");
    setAuditEntries([]);
    setActiveModal("unblock");
  };

  const confirmBlockUser = async () => {
    if (!selectedUser) return;
    await repo.temporarilyBlockUser({
      userId: selectedUser.userId,
      reason: blockReason,
      durationValue: blockDurationValue,
      durationUnit: blockDurationUnit,
    });
    await refresh();
    setSelectedUser(null);
    setActiveModal(null);
  };

  const confirmUnblockUser = async () => {
    if (!selectedUser) return;
    await repo.unblockUser({ userId: selectedUser.userId, reason: unblockReason });
    await refresh();
    setSelectedUser(null);
    setActiveModal(null);
  };

  const closeAuditDialog = () => {
    setSelectedUser(null);
    setAuditEntries([]);
    setActiveModal(null);
  };

  return (
    <div className="space-y-6 text-[13.5px] text-slate-700">
      <div>
        <h1 className="text-[28px] font-semibold text-slate-900">Platform Controls</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Configure usage protections and manage abusive/flagged users. Govern chatbot availability
          and compliance settings while viewing chatbot performance metrics
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-[13.5px] text-blue-900">
        <span className="font-semibold">Admin Role Restrictions:</span> All configuration changes
        and moderation actions are audit-logged with administrator identity and timestamps for
        governance accountability
      </div>

      <PlatformControlsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "feedback" && (
        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
              {error}
            </div>
          )}

          <div>
            <div className="text-[15px] font-semibold text-slate-900">Comment Rate Limits</div>
            <div className="text-[13.5px] text-slate-500">
              Configure comment submission rate limits to prevent spam and abuse.
            </div>
          </div>

          <CommentRateLimitsCard
            key={rateSettings?.updatedAt ?? "rate-settings"}
            loading={loading || !rateSettings}
            settings={rateSettings}
            onSave={handleSaveRateLimits}
          />

          <div>
            <div className="text-[15px] font-semibold text-slate-900">Flagged Users</div>
            <div className="text-[13.5px] text-slate-500">
              Manage users who have been flagged for policy violations or abusive behavior.
            </div>
          </div>

          <FlaggedUsersTable
            rows={flaggedUsers}
            onViewAudit={handleViewAudit}
            onBlock={handleBlockUser}
            onUnblock={handleUnblockUser}
          />
        </div>
      )}

      {activeTab === "chatbot" && (
        <div className="space-y-6">
          <ChatbotMetricsRow metrics={chatbotMetrics} loading={loading || !chatbotMetrics} />

          <div>
            <div className="text-[15px] font-semibold text-slate-900">Chatbot Rate Limits</div>
            <div className="text-[13.5px] text-slate-500">
              Configure chatbot request rate limits to ensure fair resource allocation and prevent abuse.
            </div>
          </div>

          <ChatbotRateLimitsCard
            key={chatbotRateLimit?.updatedAt ?? "chatbot-rate-limit"}
            policy={chatbotRateLimit}
            loading={loading || !chatbotRateLimit}
            onSave={handleSaveChatbotRateLimits}
          />

          <ChatbotPolicyCard
            key={chatbotPolicy?.updatedAt ?? "chatbot-policy"}
            policy={chatbotPolicy}
            loading={loading || !chatbotPolicy}
            onSave={handleSaveChatbotPolicy}
          />
        </div>
      )}

      <UserAuditHistoryDialog
        open={activeModal === "audit" && selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) closeAuditDialog();
        }}
        user={selectedUser}
        entries={auditEntries}
      />

      <BlockUserDialog
        open={activeModal === "block" && selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null);
            setActiveModal(null);
          }
        }}
        user={selectedUser}
        durationValue={blockDurationValue}
        durationUnit={blockDurationUnit}
        reason={blockReason}
        onDurationValueChange={setBlockDurationValue}
        onDurationUnitChange={setBlockDurationUnit}
        onReasonChange={setBlockReason}
        onConfirm={confirmBlockUser}
      />

      <UnblockUserDialog
        open={activeModal === "unblock" && selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null);
            setActiveModal(null);
          }
        }}
        user={selectedUser}
        reason={unblockReason}
        onReasonChange={setUnblockReason}
        onConfirm={confirmUnblockUser}
      />
    </div>
  );
}
