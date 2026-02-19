"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Megaphone } from "lucide-react";
import type { SystemBannerDraft } from "@/lib/repos/system-administration/types";

export default function BannerComposerCard({
  draft,
  onChange,
}: {
  draft: SystemBannerDraft;
  onChange: (next: SystemBannerDraft) => void;
}) {
  const update = (partial: Partial<SystemBannerDraft>) => onChange({ ...draft, ...partial });

  return (
    <Card className="border-slate-200">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-[15px]">Banner Composer</CardTitle>
            <div className="text-[12px] text-slate-500">Create and configure banner content</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-xs text-slate-500">Banner Title (Optional)</div>
          <Input
            value={draft.title ?? ""}
            onChange={(event) => update({ title: event.target.value })}
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs text-slate-500">Banner Message *</div>
          <Textarea
            value={draft.message}
            onChange={(event) => update({ message: event.target.value })}
            placeholder="Enter the message to display to all users..."
            className="min-h-[120px]"
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs text-slate-500">Severity Level</div>
          <Select
            value={draft.severity}
            onValueChange={(value) =>
              update({ severity: value as SystemBannerDraft["severity"] })
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Info">Info</SelectItem>
              <SelectItem value="Warning">Warning</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-slate-500">Schedule (Optional)</div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              type="datetime-local"
              value={draft.startAt ?? ""}
              onChange={(event) => update({ startAt: event.target.value })}
              className="h-10"
            />
            <Input
              type="datetime-local"
              value={draft.endAt ?? ""}
              onChange={(event) => update({ endAt: event.target.value })}
              className="h-10"
            />
          </div>
          <div className="text-[11px] text-slate-400">
            Leave empty to display banner immediately and indefinitely.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

