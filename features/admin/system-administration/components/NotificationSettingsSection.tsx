"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { NotificationSettings } from "@/lib/repos/system-administration/types";
import NotificationControlsCard from "./NotificationControlsCard";
import ConfirmNotificationSettingsModal from "./ConfirmNotificationSettingsModal";

export default function NotificationSettingsSection({
  settings,
  loading,
  onSave,
}: {
  settings: NotificationSettings;
  loading: boolean;
  onSave: (next: NotificationSettings) => Promise<void>;
}) {
  const [draft, setDraft] = useState(settings);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    await onSave(draft);
    setConfirmOpen(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[15px] font-semibold text-slate-900">Notification Settings</div>
        <div className="text-[13.5px] text-slate-500">
          Configure system-wide notification delivery for administrative actions and user submissions.
        </div>
      </div>

      <NotificationControlsCard settings={draft} onChange={setDraft} />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="bg-[#0E5D6F] text-white hover:bg-[#0E5D6F]/90"
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
        >
          Save Notification Settings
        </Button>
      </div>

      <div className="rounded-lg bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
        Audit Logging: Notification settings changes are logged with administrator identity and timestamp.
      </div>

      <ConfirmNotificationSettingsModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

