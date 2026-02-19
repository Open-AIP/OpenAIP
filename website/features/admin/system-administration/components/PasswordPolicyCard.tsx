"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { KeyRound } from "lucide-react";
import type { PasswordPolicy } from "@/lib/repos/system-administration/types";

type PolicyToggle = {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
};

export default function PasswordPolicyCard({
  policy,
  onChange,
}: {
  policy: PasswordPolicy;
  onChange: (next: PasswordPolicy) => void;
}) {
  const update = (partial: Partial<PasswordPolicy>) => onChange({ ...policy, ...partial });

  const toggles: PolicyToggle[] = [
    {
      label: "Require Uppercase",
      value: policy.requireUppercase,
      onChange: (next) => update({ requireUppercase: next }),
    },
    {
      label: "Require Lowercase",
      value: policy.requireLowercase,
      onChange: (next) => update({ requireLowercase: next }),
    },
    {
      label: "Require Numbers",
      value: policy.requireNumbers,
      onChange: (next) => update({ requireNumbers: next }),
    },
    {
      label: "Require Special Characters",
      value: policy.requireSpecialCharacters,
      onChange: (next) => update({ requireSpecialCharacters: next }),
    },
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-[15px]">Password Policy</CardTitle>
            <div className="text-[12px] text-slate-500">Define password requirements</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-xs text-slate-500">Minimum Password Length</div>
          <Input
            type="number"
            min={6}
            value={policy.minLength}
            onChange={(event) => update({ minLength: Number(event.target.value) })}
            className="h-10"
          />
        </div>

        <div className="space-y-3">
          {toggles.map((toggle) => (
            <div key={toggle.label} className="flex items-center justify-between">
              <div className="text-xs text-slate-600">{toggle.label}</div>
              <Switch checked={toggle.value} onCheckedChange={toggle.onChange} />
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-blue-50 px-4 py-3 text-[11px] text-blue-700">
          Policy Note: Confirm supported password policy parameters with your system requirements.
        </div>
      </CardContent>
    </Card>
  );
}

