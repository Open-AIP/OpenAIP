"use client";

import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CitizenAuthHeader from "@/features/citizen/auth/components/CitizenAuthHeader";

type CitizenSignupEmailStepProps = {
  titleId: string;
  descriptionId: string;
  email: string;
  errorMessage: string | null;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
};

export default function CitizenSignupEmailStep({
  titleId,
  descriptionId,
  email,
  errorMessage,
  isLoading,
  onEmailChange,
  onSubmit,
}: CitizenSignupEmailStepProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white p-8 md:p-10">
      <div className="m-auto w-full max-w-md space-y-8">
        <CitizenAuthHeader
          titleId={titleId}
          descriptionId={descriptionId}
          title="Welcome to OpenAIP"
          description="Create an account to share feedback and support your barangay's transparency."
        />

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label
              htmlFor="citizen-signup-email"
              className="text-sm font-medium text-slate-800"
            >
              Email Address
            </Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                id="citizen-signup-email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="you@example.com"
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
            {isLoading ? "Continuing..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
