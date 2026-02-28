"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CitizenAccountProfile } from "@/features/citizen/auth/types";
import { supabaseBrowser } from "@/lib/supabase/client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: CitizenAccountProfile;
  onSaved: () => Promise<void> | void;
  onLoggedOut: () => Promise<void> | void;
};

type ProvinceRow = {
  id: string;
  name: string;
  is_active: boolean;
};

type CityRow = {
  id: string;
  name: string;
  province_id: string | null;
  is_active: boolean;
};

type MunicipalityRow = {
  id: string;
  name: string;
  province_id: string | null;
  is_active: boolean;
};

type BarangayRow = {
  id: string;
  name: string;
  city_id: string | null;
  municipality_id: string | null;
  is_active: boolean;
};

type ProvinceOption = {
  id: string;
  name: string;
};

type LocalityOption = {
  key: string;
  id: string;
  name: string;
  provinceId: string;
  type: "city" | "municipality";
};

type BarangayOption = {
  id: string;
  name: string;
  localityType: "city" | "municipality";
  localityId: string;
};

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeEditableValue(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function toDisplayValue(value: string): string {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : "-";
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-slate-700">{label}</Label>
      <Input
        value={toDisplayValue(value)}
        readOnly
        className="h-11 border-slate-200 bg-slate-50 text-slate-900"
        aria-readonly="true"
      />
    </div>
  );
}

type EditableFieldProps = {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
};

function EditableField({ label, id, value, onChange, disabled }: EditableFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm text-slate-700">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-11 border-slate-300 bg-white text-slate-900"
      />
    </div>
  );
}

export default function CitizenAccountModal({
  open,
  onOpenChange,
  profile,
  onSaved,
  onLoggedOut,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");

  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const [localityOptions, setLocalityOptions] = useState<LocalityOption[]>([]);
  const [barangayOptions, setBarangayOptions] = useState<BarangayOption[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedLocalityKey, setSelectedLocalityKey] = useState("");
  const [selectedBarangayId, setSelectedBarangayId] = useState("");

  useEffect(() => {
    if (!open) return;
    setIsEditing(false);
    setError(null);
    setFullName(profile.fullName.trim());
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;

    let active = true;
    const supabase = supabaseBrowser();

    const loadGeoOptions = async () => {
      setIsLoadingGeo(true);
      setError(null);
      try {
        const [provincesResult, citiesResult, municipalitiesResult, barangaysResult] =
          await Promise.all([
            supabase.from("provinces").select("id,name,is_active").eq("is_active", true),
            supabase.from("cities").select("id,name,province_id,is_active").eq("is_active", true),
            supabase
              .from("municipalities")
              .select("id,name,province_id,is_active")
              .eq("is_active", true),
            supabase
              .from("barangays")
              .select("id,name,city_id,municipality_id,is_active")
              .eq("is_active", true),
          ]);

        if (provincesResult.error) throw provincesResult.error;
        if (citiesResult.error) throw citiesResult.error;
        if (municipalitiesResult.error) throw municipalitiesResult.error;
        if (barangaysResult.error) throw barangaysResult.error;

        const provinces = ((provincesResult.data ?? []) as ProvinceRow[]).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        const cities = (citiesResult.data ?? []) as CityRow[];
        const municipalities = (municipalitiesResult.data ?? []) as MunicipalityRow[];
        const barangays = (barangaysResult.data ?? []) as BarangayRow[];

        const nextProvinceOptions: ProvinceOption[] = provinces.map((row) => ({
          id: row.id,
          name: row.name,
        }));

        const nextLocalityOptions: LocalityOption[] = [
          ...cities
            .filter((row) => typeof row.province_id === "string" && row.province_id.length > 0)
            .map((row) => ({
              key: `city:${row.id}`,
              id: row.id,
              name: row.name,
              provinceId: row.province_id as string,
              type: "city" as const,
            })),
          ...municipalities
            .filter((row) => typeof row.province_id === "string" && row.province_id.length > 0)
            .map((row) => ({
              key: `municipality:${row.id}`,
              id: row.id,
              name: row.name,
              provinceId: row.province_id as string,
              type: "municipality" as const,
            })),
        ].sort((a, b) => a.name.localeCompare(b.name));

        const nextBarangayOptions: BarangayOption[] = barangays
          .map((row) => {
            if (row.city_id) {
              return {
                id: row.id,
                name: row.name,
                localityType: "city" as const,
                localityId: row.city_id,
              };
            }

            if (row.municipality_id) {
              return {
                id: row.id,
                name: row.name,
                localityType: "municipality" as const,
                localityId: row.municipality_id,
              };
            }

            return null;
          })
          .filter((value): value is BarangayOption => value !== null)
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!active) return;

        setProvinceOptions(nextProvinceOptions);
        setLocalityOptions(nextLocalityOptions);
        setBarangayOptions(nextBarangayOptions);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load profile location options."
        );
      } finally {
        if (active) {
          setIsLoadingGeo(false);
        }
      }
    };

    void loadGeoOptions();

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (provinceOptions.length === 0 || localityOptions.length === 0 || barangayOptions.length === 0) {
      return;
    }

    const selectedProvince =
      provinceOptions.find((option) => normalizeName(option.name) === normalizeName(profile.province)) ??
      null;
    const selectedLocality =
      localityOptions.find((option) => normalizeName(option.name) === normalizeName(profile.city)) ?? null;
    const selectedBarangay =
      barangayOptions.find((option) => normalizeName(option.name) === normalizeName(profile.barangay)) ??
      null;

    setSelectedProvinceId(selectedProvince?.id ?? "");
    setSelectedLocalityKey(selectedLocality?.key ?? "");
    setSelectedBarangayId(selectedBarangay?.id ?? "");
  }, [open, profile, provinceOptions, localityOptions, barangayOptions]);

  const availableLocalities = useMemo(
    () =>
      localityOptions.filter(
        (option) => selectedProvinceId.length > 0 && option.provinceId === selectedProvinceId
      ),
    [localityOptions, selectedProvinceId]
  );

  const selectedLocality = useMemo(
    () => availableLocalities.find((option) => option.key === selectedLocalityKey) ?? null,
    [availableLocalities, selectedLocalityKey]
  );

  const availableBarangays = useMemo(() => {
    if (!selectedLocality) return [];
    return barangayOptions.filter(
      (option) =>
        option.localityType === selectedLocality.type && option.localityId === selectedLocality.id
    );
  }, [barangayOptions, selectedLocality]);

  const currentProvinceName =
    provinceOptions.find((option) => option.id === selectedProvinceId)?.name ?? profile.province;
  const currentCityName = selectedLocality?.name ?? profile.city;
  const currentBarangayName =
    availableBarangays.find((option) => option.id === selectedBarangayId)?.name ?? profile.barangay;
  const normalizedFullName = normalizeEditableValue(fullName);
  const normalizedProvince = normalizeEditableValue(currentProvinceName);
  const normalizedCity = normalizeEditableValue(currentCityName);
  const normalizedBarangay = normalizeEditableValue(currentBarangayName);
  const normalizedOriginalFullName = normalizeEditableValue(profile.fullName);
  const normalizedOriginalProvince = normalizeEditableValue(profile.province);
  const normalizedOriginalCity = normalizeEditableValue(profile.city);
  const normalizedOriginalBarangay = normalizeEditableValue(profile.barangay);
  const hasChanges =
    normalizedFullName !== normalizedOriginalFullName ||
    normalizedProvince !== normalizedOriginalProvince ||
    normalizedCity !== normalizedOriginalCity ||
    normalizedBarangay !== normalizedOriginalBarangay;
  const isEditFormValid =
    normalizedFullName.length > 0 &&
    normalizedProvince.length > 0 &&
    normalizedCity.length > 0 &&
    normalizedBarangay.length > 0;

  const handleProvinceChange = (value: string) => {
    setSelectedProvinceId(value);
    setSelectedLocalityKey("");
    setSelectedBarangayId("");
  };

  const handleLocalityChange = (value: string) => {
    setSelectedLocalityKey(value);
    setSelectedBarangayId("");
  };

  const handleBarangayChange = (value: string) => {
    setSelectedBarangayId(value);
  };

  const handleToggleEditOrSave = async () => {
    if (!isEditing) {
      setError(null);
      setIsEditing(true);
      return;
    }

    if (!isEditFormValid) {
      setError("All editable fields are required before saving.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/profile/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: normalizedFullName,
          province: normalizedProvince,
          city: normalizedCity,
          barangay: normalizedBarangay,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: { message?: string } }
        | null;

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error?.message ?? "Unable to save profile.");
      }

      await onSaved();
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError(null);
    try {
      const response = await fetch("/auth/sign-out", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: { message?: string } }
        | null;

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error?.message ?? "Unable to log out.");
      }

      onOpenChange(false);
      await onLoggedOut();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Unable to log out.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isBusy = isSaving || isLoggingOut;
  const isEditSaveDisabled =
    isBusy || isLoadingGeo || (isEditing && (!hasChanges || !isEditFormValid));

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isBusy) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="border-slate-200 bg-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Citizen Account</DialogTitle>
          <DialogDescription>
            View and update your profile information used for citizen services.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {isEditing ? (
            <div className="grid grid-cols-1 gap-4">
              <EditableField
                label="Full Name"
                id="citizen-profile-full-name"
                value={fullName}
                onChange={setFullName}
                disabled={isBusy}
              />
            </div>
          ) : (
            <ReadOnlyField label="Full Name" value={profile.fullName} />
          )}

          <ReadOnlyField label="Email" value={profile.email} />

          {isEditing ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="citizen-profile-province" className="text-sm text-slate-700">
                  Province
                </Label>
                <Select
                  value={selectedProvinceId || undefined}
                  onValueChange={handleProvinceChange}
                  disabled={isBusy || isLoadingGeo}
                >
                  <SelectTrigger id="citizen-profile-province" className="h-11 border-slate-300 bg-white">
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinceOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="citizen-profile-city" className="text-sm text-slate-700">
                  City
                </Label>
                <Select
                  value={selectedLocalityKey || undefined}
                  onValueChange={handleLocalityChange}
                  disabled={isBusy || isLoadingGeo || !selectedProvinceId}
                >
                  <SelectTrigger id="citizen-profile-city" className="h-11 border-slate-300 bg-white">
                    <SelectValue placeholder={selectedProvinceId ? "Select city" : "Select province first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLocalities.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="citizen-profile-barangay" className="text-sm text-slate-700">
                  Barangay
                </Label>
                <Select
                  value={selectedBarangayId || undefined}
                  onValueChange={handleBarangayChange}
                  disabled={isBusy || isLoadingGeo || !selectedLocalityKey}
                >
                  <SelectTrigger id="citizen-profile-barangay" className="h-11 border-slate-300 bg-white">
                    <SelectValue placeholder={selectedLocalityKey ? "Select barangay" : "Select city first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBarangays.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ReadOnlyField label="Province" value={profile.province} />
              <ReadOnlyField label="City" value={profile.city} />
              <ReadOnlyField label="Barangay" value={profile.barangay} />
            </div>
          )}

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" disabled={isBusy} onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isEditSaveDisabled}
              onClick={() => void handleToggleEditOrSave()}
            >
              {isSaving ? "Saving..." : isEditing ? "Save" : "Edit"}
            </Button>
            <Button type="button" variant="destructive" disabled={isBusy} onClick={() => void handleLogout()}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
