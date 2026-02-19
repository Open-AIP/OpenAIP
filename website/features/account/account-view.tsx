/**
 * Account View Component
 * 
 * Displays user account information and security settings.
 * Provides a read-only view of user profile data managed by administrators,
 * and includes password management functionality.
 * 
 * @module feature/account/account-view
 */

"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {UpdatePasswordForm} from "./update-password-form";

/**
 * User account information type
 */
type AccountUser = {
  fullName: string;
  email: string;
  position: string;
  office: string;
  role: string;
  baseURL: string;
};

/**
 * ReadOnlyField Component
 * 
 * Renders a disabled input field with a label indicating it's managed by admin.
 * Used for displaying non-editable user information.
 * 
 * @param label - The field label
 * @param value - The field value to display
 */
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

/**
 * AccountView Component
 * 
 * Main account page component that displays:
 * - User profile information (read-only, admin-managed)
 * - Password update form for security management
 * 
 * @param user - The authenticated user's account information
 */
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
      <UpdatePasswordForm role={user.role} baseURL={user.baseURL} />
    </div>
  );
}
