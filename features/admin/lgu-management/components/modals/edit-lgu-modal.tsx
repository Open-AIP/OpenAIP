"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  LguRecord,
  LguStatus,
  LguType,
  UpdateLguInput,
} from "@/lib/repos/lgu/repo";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lgu: LguRecord | null;
  cityOptions: LguRecord[];
  onSave: (id: string, patch: UpdateLguInput, nextStatus: LguStatus) => Promise<void>;
};

export default function EditLguModal({
  open,
  onOpenChange,
  lgu,
  cityOptions,
  onSave,
}: Props) {
  const [type, setType] = useState<LguType | "">("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<LguStatus>("active");
  const [parentCityId, setParentCityId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!lgu) return;
    setType(lgu.type);
    setName(lgu.name);
    setCode(lgu.code);
    setStatus(lgu.status);
    setParentCityId(lgu.parentCityId ?? "");
    setErrors({});
    setSubmitting(false);
  }, [lgu, open]);

  const parentCityName = useMemo(() => {
    if (!parentCityId) return "";
    return cityOptions.find((c) => c.id === parentCityId)?.name ?? "";
  }, [cityOptions, parentCityId]);

  async function handleSave() {
    if (!lgu) return;

    const nextErrors: Record<string, string> = {};
    if (!type) nextErrors.type = "LGU Type is required.";
    if (!name.trim()) nextErrors.name = "LGU Name is required.";
    if (!code.trim()) nextErrors.code = "LGU Code / ID is required.";
    if (type === "barangay" && !parentCityId) {
      nextErrors.parentCityId = "Parent City is required for barangays.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const patch: UpdateLguInput = {
      type: type as LguType,
      name: name.trim(),
      code: code.trim(),
      parentCityId: type === "barangay" ? parentCityId : null,
      parentCityName: type === "barangay" ? parentCityName : null,
    };

    setSubmitting(true);
    try {
      await onSave(lgu.id, patch, status);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit LGU</DialogTitle>
        </DialogHeader>

        {!lgu ? (
          <div className="text-sm text-slate-500">No LGU selected.</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                LGU Type <span className="text-rose-600">*</span>
              </Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  const next = v as LguType;
                  setType(next);
                  if (next === "city") {
                    setParentCityId("");
                  }
                }}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select LGU Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="barangay">Barangay</SelectItem>
                </SelectContent>
              </Select>
              {errors.type ? (
                <div className="text-xs text-rose-600">{errors.type}</div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>
                LGU Name <span className="text-rose-600">*</span>
              </Label>
              <Input className="h-11" value={name} onChange={(e) => setName(e.target.value)} />
              {errors.name ? (
                <div className="text-xs text-rose-600">{errors.name}</div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>
                LGU Code / ID <span className="text-rose-600">*</span>
              </Label>
              <Input className="h-11" value={code} onChange={(e) => setCode(e.target.value)} />
              {errors.code ? (
                <div className="text-xs text-rose-600">{errors.code}</div>
              ) : null}
            </div>

            {type === "barangay" ? (
              <div className="space-y-2">
                <Label>
                  Parent City <span className="text-rose-600">*</span>
                </Label>
                <Select value={parentCityId} onValueChange={setParentCityId}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select parent city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cityOptions.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.parentCityId ? (
                  <div className="text-xs text-rose-600">{errors.parentCityId}</div>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>
                Status <span className="text-rose-600">*</span>
              </Label>
              <div className="flex items-center gap-8 pt-1">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="lgu-status"
                    value="active"
                    checked={status === "active"}
                    onChange={() => setStatus("active")}
                    className="h-4 w-4 accent-teal-700"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="lgu-status"
                    value="deactivated"
                    checked={status === "deactivated"}
                    onChange={() => setStatus("deactivated")}
                    className="h-4 w-4 accent-teal-700"
                  />
                  Deactivated
                </label>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                className="flex-1 bg-teal-700 hover:bg-teal-800"
                onClick={handleSave}
                disabled={submitting}
              >
                Save LGU
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

