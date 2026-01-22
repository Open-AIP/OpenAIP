"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {UpdatePasswordForm} from "./update-password-form";

type AccountUser = {
  fullName: string;
  email: string;
  position: string;
  office: string;
};

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const id = React.useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm text-slate-700">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          readOnly
          disabled
          className="h-11 bg-slate-50 border-slate-200 disabled:opacity-100 disabled:cursor-default pr-10"
        />
        <div className="mt-2 text-xs text-slate-400">Managed by Admin</div>
      </div>
    </div>
  );
}

export default function AccountView({ user }: { user: AccountUser }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Account</h1>
        <p className="mt-2 text-sm text-slate-600">
          View your account information and manage security settings for your official access.
        </p>
      </div>

      {/* Account Information */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">Account Information</h2>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReadOnlyField label="Name" value={user.fullName} />
            <ReadOnlyField label="Office Email" value={user.email} />
            <ReadOnlyField label="Position" value={user.position} />
            <ReadOnlyField label="Office" value={user.office} />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <UpdatePasswordForm />
    </div>
  );
}
