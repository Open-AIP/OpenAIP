"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SystemBannerDraft } from "@/lib/repos/system-administration/types";
import BannerComposerCard from "./BannerComposerCard";
import BannerPreviewCard from "./BannerPreviewCard";
import ConfirmPublishBannerModal from "./ConfirmPublishBannerModal";

const isScheduleValid = (draft: SystemBannerDraft) => {
  if (!draft.startAt && !draft.endAt) return true;
  if (!draft.startAt || !draft.endAt) return false;
  return new Date(draft.endAt).getTime() > new Date(draft.startAt).getTime();
};

export default function SystemBannerSection({
  draft,
  loading,
  onPublish,
}: {
  draft: SystemBannerDraft;
  loading: boolean;
  onPublish: (next: SystemBannerDraft) => Promise<void>;
}) {
  const [localDraft, setLocalDraft] = useState(draft);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const isValid = useMemo(() => {
    return localDraft.message.trim().length > 0 && isScheduleValid(localDraft);
  }, [localDraft]);

  const handlePublish = async () => {
    await onPublish(localDraft);
    setSaved(true);
    setConfirmOpen(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[15px] font-semibold text-slate-900">System Banner</div>
        <div className="text-[13.5px] text-slate-500">
          Configure and publish system-wide banners for announcements, maintenance notices, or critical
          alerts.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BannerComposerCard draft={localDraft} onChange={setLocalDraft} />
        <div className="space-y-4">
          <BannerPreviewCard draft={localDraft} />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="bg-[#0E5D6F] text-white hover:bg-[#0E5D6F]/90"
              onClick={() => setConfirmOpen(true)}
              disabled={!isValid || loading}
            >
              Publish Banner
            </Button>
            {saved && (
              <span className="text-[12px] text-emerald-600">Banner published successfully.</span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900">
        <span className="font-semibold">High-Impact Action:</span> System banners are visible to all
        users across the entire platform. Publishing or disabling a banner requires confirmation and is
        audit-logged for compliance.
      </div>

      <ConfirmPublishBannerModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handlePublish}
        confirmDisabled={!isValid || loading}
      />
    </div>
  );
}

