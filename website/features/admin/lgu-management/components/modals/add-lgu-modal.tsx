"use client";

import { useMemo, useState } from "react";
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
  BarangayParentType,
  CreateLguInput,
  LguRecord,
  LguType,
} from "@/lib/repos/lgu/repo";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lgus: LguRecord[];
  onSave: (input: CreateLguInput) => Promise<void>;
};

function psgcLength(type: LguType) {
  if (type === "region") return 2;
  if (type === "province") return 4;
  if (type === "city") return 6;
  if (type === "municipality") return 6;
  return 9;
}

function isNcrRegion(region: LguRecord | null) {
  if (!region) return false;
  return (
    region.code === "13" ||
    region.name.toLowerCase().includes("national capital region")
  );
}

export default function AddLguModal({
  open,
  onOpenChange,
  lgus,
  onSave,
}: Props) {
  const [type, setType] = useState<LguType | "">("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [regionId, setRegionId] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [parentType, setParentType] = useState<BarangayParentType | "">("");
  const [parentId, setParentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const regions = useMemo(
    () =>
      lgus
        .filter((row) => row.type === "region")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [lgus]
  );
  const provinces = useMemo(
    () =>
      lgus
        .filter((row) => row.type === "province")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [lgus]
  );
  const cities = useMemo(
    () =>
      lgus
        .filter((row) => row.type === "city")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [lgus]
  );
  const municipalities = useMemo(
    () =>
      lgus
        .filter((row) => row.type === "municipality")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [lgus]
  );

  const selectedRegion = useMemo(
    () => regions.find((row) => row.id === regionId) ?? null,
    [regions, regionId]
  );
  const selectedType = type || null;
  const ncrSelected = isNcrRegion(selectedRegion);

  const filteredProvinces = useMemo(() => {
    if (!regionId) return provinces;
    return provinces.filter((row) => row.regionId === regionId);
  }, [provinces, regionId]);

  const filteredCityParents = useMemo(() => {
    return cities.filter((row) => {
      if (regionId && row.regionId !== regionId) return false;
      if (provinceId && row.provinceId !== provinceId) return false;
      return true;
    });
  }, [cities, regionId, provinceId]);

  const filteredMunicipalityParents = useMemo(() => {
    return municipalities.filter((row) => {
      if (regionId && row.regionId !== regionId) return false;
      if (provinceId && row.provinceId !== provinceId) return false;
      return true;
    });
  }, [municipalities, regionId, provinceId]);

  const parentOptions = useMemo(() => {
    if (parentType === "city") return filteredCityParents;
    if (parentType === "municipality") return filteredMunicipalityParents;
    return [];
  }, [filteredCityParents, filteredMunicipalityParents, parentType]);

  function resetForm() {
    setType("");
    setName("");
    setCode("");
    setRegionId("");
    setProvinceId("");
    setParentType("");
    setParentId("");
    setErrors({});
    setSubmitting(false);
  }

  async function handleSave() {
    const nextErrors: Record<string, string> = {};

    if (!type) nextErrors.type = "LGU Type is required.";
    if (!name.trim()) nextErrors.name = "LGU Name is required.";
    if (!code.trim()) nextErrors.code = "PSGC code is required.";

    if (selectedType) {
      const expectedLength = psgcLength(selectedType);
      if (!/^[0-9]+$/.test(code.trim())) {
        nextErrors.code = "PSGC code must contain digits only.";
      } else if (code.trim().length !== expectedLength) {
        nextErrors.code = `PSGC code for ${selectedType} must be ${expectedLength} digits.`;
      }
    }

    if (type === "province" && !regionId) {
      nextErrors.regionId = "Region is required for provinces.";
    }

    if (type === "city") {
      if (!regionId) nextErrors.regionId = "Region is required for cities.";
      if (!ncrSelected && !provinceId) {
        nextErrors.provinceId = "Province is required for cities outside NCR.";
      }
    }

    if (type === "municipality") {
      if (!regionId) nextErrors.regionId = "Region is required for municipalities.";
      if (!provinceId) nextErrors.provinceId = "Province is required for municipalities.";
    }

    if (type === "barangay") {
      if (!parentType) nextErrors.parentType = "Select City or Municipality.";
      if (!parentId) nextErrors.parentId = "Parent LGU is required for barangays.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !selectedType) return;

    const payload: CreateLguInput = {
      type: selectedType,
      name: name.trim(),
      code: code.trim(),
    };

    if (selectedType === "province") {
      payload.regionId = regionId;
    } else if (selectedType === "city") {
      payload.regionId = regionId;
      payload.provinceId = ncrSelected ? null : provinceId;
      payload.isIndependent = ncrSelected;
    } else if (selectedType === "municipality") {
      payload.provinceId = provinceId;
    } else if (selectedType === "barangay") {
      payload.parentType = parentType as BarangayParentType;
      payload.parentId = parentId;
    }

    setSubmitting(true);
    try {
      await onSave(payload);
      onOpenChange(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New LGU</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              LGU Type <span className="text-rose-600">*</span>
            </Label>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as LguType);
                setRegionId("");
                setProvinceId("");
                setParentType("");
                setParentId("");
              }}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Select LGU Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="region">Region</SelectItem>
                <SelectItem value="province">Province</SelectItem>
                <SelectItem value="city">City</SelectItem>
                <SelectItem value="municipality">Municipality</SelectItem>
                <SelectItem value="barangay">Barangay</SelectItem>
              </SelectContent>
            </Select>
            {errors.type ? <div className="text-xs text-rose-600">{errors.type}</div> : null}
          </div>

          <div className="space-y-2">
            <Label>
              LGU Name <span className="text-rose-600">*</span>
            </Label>
            <Input
              className="h-11"
              placeholder="Enter LGU name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name ? <div className="text-xs text-rose-600">{errors.name}</div> : null}
          </div>

          <div className="space-y-2">
            <Label>
              PSGC Code <span className="text-rose-600">*</span>
            </Label>
            <Input
              className="h-11"
              placeholder={
                selectedType
                  ? `${psgcLength(selectedType)} digits`
                  : "Enter PSGC code"
              }
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            {errors.code ? <div className="text-xs text-rose-600">{errors.code}</div> : null}
          </div>

          {(type === "province" || type === "city" || type === "municipality" || type === "barangay") && (
            <div className="space-y-2">
              <Label>
                {type === "barangay" ? "Filter by Region (optional)" : "Region"}
                {type !== "barangay" ? <span className="text-rose-600"> *</span> : null}
              </Label>
              <Select
                value={type === "barangay" ? (regionId || "all") : regionId}
                onValueChange={(value) => {
                  const nextRegion = value === "all" ? "" : value;
                  setRegionId(nextRegion);
                  setProvinceId("");
                  if (type === "barangay") setParentId("");
                }}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue
                    placeholder={
                      type === "barangay"
                        ? "All regions"
                        : "Select region"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {type === "barangay" ? (
                    <SelectItem value="all">All regions</SelectItem>
                  ) : null}
                  {regions.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.regionId ? (
                <div className="text-xs text-rose-600">{errors.regionId}</div>
              ) : null}
            </div>
          )}

          {(type === "city" || type === "municipality" || type === "barangay") && (
            <div className="space-y-2">
              <Label>
                {type === "barangay" ? "Filter by Province (optional)" : "Province"}
                {type === "municipality" || (type === "city" && !ncrSelected) ? (
                  <span className="text-rose-600"> *</span>
                ) : null}
              </Label>
              <Select
                value={type === "barangay" ? (provinceId || "all") : provinceId}
                onValueChange={(value) => {
                  const nextProvince = value === "all" ? "" : value;
                  setProvinceId(nextProvince);
                  if (type === "barangay") setParentId("");
                }}
                disabled={type === "city" && ncrSelected}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue
                    placeholder={
                      type === "barangay"
                        ? "All provinces"
                        : ncrSelected
                        ? "N/A for NCR cities"
                        : "Select province"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {type === "barangay" ? (
                    <SelectItem value="all">All provinces</SelectItem>
                  ) : null}
                  {filteredProvinces.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {ncrSelected && type === "city" ? (
                <div className="text-xs text-slate-500">
                  Province is automatically set to N/A for NCR cities.
                </div>
              ) : null}
              {errors.provinceId ? (
                <div className="text-xs text-rose-600">{errors.provinceId}</div>
              ) : null}
            </div>
          )}

          {type === "barangay" ? (
            <>
              <div className="space-y-2">
                <Label>
                  Parent Type <span className="text-rose-600">*</span>
                </Label>
                <Select
                  value={parentType}
                  onValueChange={(value) => {
                    setParentType(value as BarangayParentType);
                    setParentId("");
                  }}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select parent type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="city">City</SelectItem>
                    <SelectItem value="municipality">Municipality</SelectItem>
                  </SelectContent>
                </Select>
                {errors.parentType ? (
                  <div className="text-xs text-rose-600">{errors.parentType}</div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>
                  Parent LGU <span className="text-rose-600">*</span>
                </Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select parent city/municipality" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptions.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.parentId ? (
                  <div className="text-xs text-rose-600">{errors.parentId}</div>
                ) : null}
              </div>
            </>
          ) : null}

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
      </DialogContent>
    </Dialog>
  );
}
