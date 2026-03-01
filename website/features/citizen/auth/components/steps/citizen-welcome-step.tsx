"use client";

import { Button } from "@/components/ui/button";
import CitizenAuthHeader from "@/features/citizen/auth/components/citizen-auth-header";

type CitizenWelcomeStepProps = {
  titleId: string;
  descriptionId: string;
  errorMessage: string | null;
  isLoading: boolean;
  showGoogleButton: boolean;
  onContinueWithEmail: () => void;
  onContinueWithGoogle: () => void;
};

export default function CitizenWelcomeStep({
  titleId,
  descriptionId,
  errorMessage,
  isLoading,
  showGoogleButton,
  onContinueWithEmail,
  onContinueWithGoogle,
}: CitizenWelcomeStepProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white p-8 md:p-10">
      <div className="m-auto w-full max-w-md space-y-8">
        <CitizenAuthHeader
          titleId={titleId}
          descriptionId={descriptionId}
          title="Welcome to OpenAIP"
          description="Sign in or create an account to access the AI assistant and submit project feedback."
        />

        <div className="space-y-4">
          {showGoogleButton ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-xl text-base font-semibold"
              disabled={isLoading}
              onClick={onContinueWithGoogle}
            >
              Continue with Google
            </Button>
          ) : null}

          <Button
            type="button"
            className="h-12 w-full rounded-xl bg-[#022E45] text-base font-semibold text-white hover:bg-[#01304A] focus-visible:ring-2 focus-visible:ring-[#0EA5C6]/40"
            disabled={isLoading}
            onClick={onContinueWithEmail}
          >
            Continue with email
          </Button>
        </div>

        {errorMessage ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
