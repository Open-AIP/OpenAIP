"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { ChatbotSystemPolicy } from "@/lib/repos/usage-controls/types";

export default function ChatbotPolicyCard({
  policy,
  loading,
  onSave,
}: {
  policy: ChatbotSystemPolicy | null;
  loading: boolean;
  onSave: (input: {
    isEnabled: boolean;
    retentionDays: number;
    userDisclaimer: string;
  }) => Promise<void>;
}) {
  const [isEnabled, setIsEnabled] = useState(policy?.isEnabled ?? true);
  const [retentionDays, setRetentionDays] = useState(policy?.retentionDays ?? 90);
  const [disclaimer, setDisclaimer] = useState(
    policy?.userDisclaimer ??
      "This disclaimer will be shown to users before they interact with the chatbot."
  );
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await onSave({ isEnabled, retentionDays, userDisclaimer: disclaimer });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-[15px]">Chatbot Policy</CardTitle>
        <div className="text-[12px] text-slate-500">
          Configure system-wide chatbot availability, data retention, and user disclaimers.
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
          <div>
            <div className="text-sm font-medium text-slate-900">Chatbot System Status</div>
            <div className="text-xs text-slate-500">
              Chatbot is currently {isEnabled ? "enabled" : "disabled"} system-wide
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            disabled={loading}
          />
        </div>

        {!isEnabled && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4" />
              <div>
                <div className="font-medium">Chatbot Disabled</div>
                The chatbot is currently disabled for all users across the system. Citizens and
                officials will not be able to access chatbot functionality.
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-700">Data Retention Duration</div>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Input
              type="number"
              min={1}
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              disabled={loading}
            />
            <Input value="Days" disabled className="text-slate-500" />
          </div>
          <div className="text-[11px] text-slate-500">
            Policy Note: Confirm allowed retention units and range per data governance policy.
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-700">User Disclaimer Text</div>
          <Textarea
            value={disclaimer}
            onChange={(e) => setDisclaimer(e.target.value)}
            placeholder="Enter disclaimer text shown to users before chatbot interactions..."
            disabled={loading}
          />
          <div className="text-[11px] text-slate-500">
            This disclaimer will be shown to users before they interact with the chatbot.
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-medium">Privacy &amp; Access Policy</div>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>Individual conversation content is not accessible to administrators</li>
                <li>Only aggregated metrics are available for monitoring</li>
                <li>Conversation-level access restricted to policy-authorized roles</li>
                <li>All policy changes are audit-logged</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="bg-[#0E5D6F] text-white hover:bg-[#0E5D6F]/90"
            onClick={handleSave}
            disabled={loading}
          >
            Save Chatbot Policy
          </Button>
          {saved && (
            <span className="text-[12px] text-emerald-600">Policy saved successfully.</span>
          )}
        </div>

        <div className="rounded-lg bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
          Audit Logging: Policy changes are logged with administrator identity and timestamp.
        </div>
      </CardContent>
    </Card>
  );
}
