"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import type { NotificationSettings } from "@/lib/repos/system-administration/types";

export default function NotificationControlsCard({
  settings,
  onChange,
}: {
  settings: NotificationSettings;
  onChange: (next: NotificationSettings) => void;
}) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-[15px]">Notification Controls</CardTitle>
            <div className="text-[12px] text-slate-500">Enable or disable notification types</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-700">Enable Review Notifications</div>
            <div className="text-[11px] text-slate-500">
              Send notifications to administrators when content requires review or moderation action.
              Includes flagged comments, reported content, and escalated issues.
            </div>
            <div className="text-[11px] text-slate-400">
              Affected Users: Moderators, Senior Administrators, System Administrators
            </div>
          </div>
          <Switch
            checked={settings.reviewNotificationsEnabled}
            onCheckedChange={(checked) =>
              onChange({ ...settings, reviewNotificationsEnabled: checked })
            }
          />
        </div>

        <div className="h-px bg-slate-100" />

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-700">Enable Submission Alerts</div>
            <div className="text-[11px] text-slate-500">
              Send real-time alerts when users submit new content such as AIP submissions, project
              updates, or high-priority feedback. Helps ensure timely administrative response.
            </div>
            <div className="text-[11px] text-slate-400">
              Affected Users: All administrators with submission monitoring permissions
            </div>
          </div>
          <Switch
            checked={settings.submissionAlertsEnabled}
            onCheckedChange={(checked) =>
              onChange({ ...settings, submissionAlertsEnabled: checked })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

