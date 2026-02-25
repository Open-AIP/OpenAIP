"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CitizenAuthHeader from "@/features/citizen/auth/components/CitizenAuthHeader";

type CitizenCompleteProfileStepProps = {
  titleId: string;
  descriptionId: string;
  firstName: string;
  lastName: string;
  barangay: string;
  city: string;
  province: string;
  password: string;
  errorMessage: string | null;
  isLoading: boolean;
  barangayOptions: readonly string[];
  cityOptions: readonly string[];
  provinceOptions: readonly string[];
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onBarangayChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

function SelectField({
  id,
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: readonly string[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5C6]/40 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CitizenCompleteProfileStep({
  titleId,
  descriptionId,
  firstName,
  lastName,
  barangay,
  city,
  province,
  password,
  errorMessage,
  isLoading,
  barangayOptions,
  cityOptions,
  provinceOptions,
  onFirstNameChange,
  onLastNameChange,
  onBarangayChange,
  onCityChange,
  onProvinceChange,
  onPasswordChange,
  onSubmit,
}: CitizenCompleteProfileStepProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white p-8 md:p-10">
      <div className="m-auto w-full max-w-md space-y-7">
        <CitizenAuthHeader
          titleId={titleId}
          descriptionId={descriptionId}
          title="Complete Your Profile"
          description="Please provide the following details to finalize your account."
        />

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="citizen-first-name" className="text-sm font-medium text-slate-800">
                First Name
              </Label>
              <Input
                id="citizen-first-name"
                type="text"
                autoComplete="given-name"
                required
                autoFocus
                value={firstName}
                onChange={(event) => onFirstNameChange(event.target.value)}
                placeholder="Juan"
                disabled={isLoading}
                className="h-12 rounded-xl border-slate-300 bg-white text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#0EA5C6]/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="citizen-last-name" className="text-sm font-medium text-slate-800">
                Last Name
              </Label>
              <Input
                id="citizen-last-name"
                type="text"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(event) => onLastNameChange(event.target.value)}
                placeholder="Dela Cruz"
                disabled={isLoading}
                className="h-12 rounded-xl border-slate-300 bg-white text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#0EA5C6]/40"
              />
            </div>
          </div>

          <SelectField
            id="citizen-barangay"
            label="Choose Barangay"
            value={barangay}
            placeholder="Select barangay"
            options={barangayOptions}
            onChange={onBarangayChange}
            disabled={isLoading}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="citizen-city"
              label="Choose City"
              value={city}
              placeholder="Select city"
              options={cityOptions}
              onChange={onCityChange}
              disabled={isLoading}
            />
            <SelectField
              id="citizen-province"
              label="Choose Province"
              value={province}
              placeholder="Select province"
              options={provinceOptions}
              onChange={onProvinceChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="citizen-signup-password" className="text-sm font-medium text-slate-800">
              Password
            </Label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                id="citizen-signup-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                disabled={isLoading}
                className="h-12 rounded-xl border-slate-300 bg-white pl-11 text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#0EA5C6]/40"
              />
            </div>
          </div>

          {errorMessage ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          ) : null}

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-[#022E45] text-base font-semibold text-white hover:bg-[#01304A] focus-visible:ring-2 focus-visible:ring-[#0EA5C6]/40"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
