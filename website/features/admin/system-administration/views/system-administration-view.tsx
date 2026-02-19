"use client";

import { useEffect, useMemo, useState } from "react";
import SecurityNoticeBanner from "../components/SecurityNoticeBanner";
import SecuritySettingsSection from "../components/SecuritySettingsSection";
import NotificationSettingsSection from "../components/NotificationSettingsSection";
import SystemBannerSection from "../components/SystemBannerSection";
import { getSystemAdministrationRepo } from "@/lib/repos/system-administration/repo";
import type {
  NotificationSettings,
  SecuritySettings,
  SystemBannerDraft,
} from "@/lib/repos/system-administration/types";

export default function SystemAdministrationView() {
  const repo = useMemo(() => getSystemAdministrationRepo(), []);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [bannerDraft, setBannerDraft] = useState<SystemBannerDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [security, notifications, banner] = await Promise.all([
          repo.getSecuritySettings(),
          repo.getNotificationSettings(),
          repo.getSystemBannerDraft(),
        ]);
        if (!isActive) return;
        setSecuritySettings(security);
        setNotificationSettings(notifications);
        setBannerDraft(banner);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Failed to load system administration data.");
      } finally {
        if (isActive) setLoading(false);
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [repo]);

  const handleSaveSecurity = async (next: SecuritySettings) => {
    const updated = await repo.updateSecuritySettings(next, {
      performedBy: "Admin Maria Rodriguez",
    });
    setSecuritySettings(updated);
  };

  const handleSaveNotifications = async (next: NotificationSettings) => {
    const updated = await repo.updateNotificationSettings(next, {
      performedBy: "Admin Maria Rodriguez",
    });
    setNotificationSettings(updated);
  };

  const handlePublishBanner = async (draft: SystemBannerDraft) => {
    await repo.publishSystemBanner(draft, { performedBy: "Admin Maria Rodriguez" });
    setBannerDraft(draft);
  };

  if (!securitySettings || !notificationSettings || !bannerDraft) {
    return (
      <div className="space-y-6 text-[13.5px] text-slate-700">
        <div>
          <h1 className="text-[28px] font-semibold text-slate-900">System Administration</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Manage security-related configuration and operational controls with confirmation dialogs
            for high-impact settings.
          </p>
        </div>
        {loading && <div className="text-sm text-slate-500">Loading system administration...</div>}
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 text-[13.5px] text-slate-700">
      <div>
        <h1 className="text-[28px] font-semibold text-slate-900">System Administration</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Manage security-related configuration and operational controls with confirmation dialogs for
          high-impact settings.
        </p>
      </div>

      <SecurityNoticeBanner />

      <SecuritySettingsSection
        key={`security-${JSON.stringify(securitySettings)}`}
        settings={securitySettings}
        loading={loading}
        onSave={handleSaveSecurity}
      />

      <NotificationSettingsSection
        key={`notifications-${JSON.stringify(notificationSettings)}`}
        settings={notificationSettings}
        loading={loading}
        onSave={handleSaveNotifications}
      />

      <SystemBannerSection
        key={`banner-${JSON.stringify(bannerDraft)}`}
        draft={bannerDraft}
        loading={loading}
        onPublish={handlePublishBanner}
      />
    </div>
  );
}

