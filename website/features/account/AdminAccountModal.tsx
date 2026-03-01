"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { AdminAccountProfile } from "@/features/account/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminAccountProfile;
};

function toDisplayValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "-";
}

function roleLabel(role: AdminAccountProfile["role"]) {
  if (role === "admin") return "Admin";
  return role;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-slate-700">{label}</Label>
      <Input
        value={toDisplayValue(value)}
        readOnly
        className="h-11 bg-slate-50 border-slate-200 text-slate-900"
        aria-readonly="true"
      />
    </div>
  );
}

export default function AdminAccountModal({ open, onOpenChange, user }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError(null);

    const supabase = supabaseBrowser();
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message || "Failed to log out.");
      setIsLoggingOut(false);
      return;
    }

    onOpenChange(false);
    router.replace("/admin/sign-in");
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setError(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-2xl border-slate-200 bg-white">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>
            View your account information and manage your current admin session.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-slate-200 shadow-none">
          <CardContent className="space-y-6 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">Account Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <ReadOnlyField label="Full Name" value={user.fullName} />
              <ReadOnlyField label="Email" value={user.email} />
              <ReadOnlyField label="Role" value={roleLabel(user.role)} />
            </div>
          </CardContent>
        </Card>

        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
