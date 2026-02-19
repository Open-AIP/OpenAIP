"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CreateOfficialAccountInput,
  LguOption,
  OfficialRole,
} from "@/lib/repos/accounts/repo";

function roleLabel(role: OfficialRole) {
  if (role === "barangay_official") return "Barangay Official";
  if (role === "city_official") return "City Official";
  return "Municipal Official";
}

function scopeTypeForRole(role: OfficialRole) {
  if (role === "city_official") return "city";
  if (role === "municipal_official") return "municipality";
  return "barangay";
}

function parseLguKey(key: string): { scopeType: CreateOfficialAccountInput["scopeType"]; scopeId: string } | null {
  const [scopeTypeRaw, ...rest] = key.split(":");
  const scopeId = rest.join(":");
  if (!scopeId) return null;
  if (
    scopeTypeRaw !== "barangay" &&
    scopeTypeRaw !== "city" &&
    scopeTypeRaw !== "municipality"
  ) {
    return null;
  }
  return { scopeType: scopeTypeRaw, scopeId };
}

export default function CreateOfficialModal({
  open,
  onOpenChange,
  roleOptions,
  lguOptions,
  onSave,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleOptions: OfficialRole[];
  lguOptions: LguOption[];
  onSave: (input: CreateOfficialAccountInput) => Promise<void>;
  loading: boolean;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OfficialRole>("barangay_official");
  const [lguKey, setLguKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredLgus = useMemo(() => {
    const scopeType = scopeTypeForRole(role);
    return lguOptions.filter((option) => option.scopeType === scopeType);
  }, [lguOptions, role]);

  function resetForm() {
    setFullName("");
    setEmail("");
    setRole("barangay_official");
    setLguKey("");
    setError(null);
  }

  async function handleSave() {
    const parsed = parseLguKey(lguKey);
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!parsed) {
      setError("LGU assignment is required.");
      return;
    }

    setError(null);
    await onSave({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      role,
      scopeType: parsed.scopeType,
      scopeId: parsed.scopeId,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Official Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              Full Name <span className="text-rose-600">*</span>
            </Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11"
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Email <span className="text-rose-600">*</span>
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
              placeholder="name@agency.gov.ph"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Role <span className="text-rose-600">*</span>
            </Label>
            <Select
              value={role}
              onValueChange={(value) => {
                setRole(value as OfficialRole);
                setLguKey("");
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {roleLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              LGU Assignment <span className="text-rose-600">*</span>
            </Label>
            <Select value={lguKey} onValueChange={setLguKey}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select an LGU" />
              </SelectTrigger>
              <SelectContent>
                {filteredLgus.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? <div className="text-sm text-rose-600">{error}</div> : null}

          <div className="pt-2 flex items-center gap-3">
            <Button
              className="flex-1 bg-teal-700 hover:bg-teal-800"
              onClick={handleSave}
              disabled={loading}
            >
              Send Invite
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
