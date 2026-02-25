"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { GEO_OPTIONS } from "@/features/citizen/auth/constants/geo-options";
import CitizenAuthBrandPanel from "@/features/citizen/auth/components/citizen-auth-brand-panel";
import CitizenAuthSplitShell from "@/features/citizen/auth/components/citizen-auth-split-shell";
import CitizenCompleteProfileStep from "@/features/citizen/auth/components/steps/citizen-complete-profile-step";
import CitizenLoginStep from "@/features/citizen/auth/components/steps/citizen-login-step";
import CitizenSignupEmailStep from "@/features/citizen/auth/components/steps/citizen-signup-email-step";
import CitizenVerifyOtpStep from "@/features/citizen/auth/components/steps/citizen-verify-otp-step";
import type { CitizenAuthMode, CitizenAuthStep } from "@/features/citizen/auth/types";
import { maskEmail } from "@/features/citizen/auth/utils/mask-email";

type CitizenAuthModalProps = {
  isOpen: boolean;
  mode: CitizenAuthMode;
  nextPath: string | null;
  onClose: () => void;
  onModeChange: (mode: CitizenAuthMode) => void;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function CitizenAuthModal({
  isOpen,
  mode,
  nextPath,
  onClose,
  onModeChange,
}: CitizenAuthModalProps) {
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();

  const [currentStep, setCurrentStep] = useState<CitizenAuthStep>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [emailMasked, setEmailMasked] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    setErrorMessage(null);
    setCurrentStep(mode === "login" ? "login" : "signup_email");
  }, [isOpen, mode]);

  const toggleMode = () => {
    const nextMode: CitizenAuthMode = currentStep === "login" ? "signup" : "login";
    setErrorMessage(null);
    setIsLoading(false);
    onModeChange(nextMode);
    setCurrentStep(nextMode === "login" ? "login" : "signup_email");
  };

  const handleLogin = async () => {
    if (!isValidEmail(loginEmail) || !loginPassword) {
      setErrorMessage("Please enter a valid email and password.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      if (error) throw error;

      const { data: roleValue, error: roleError } = await supabase.rpc("current_role");
      if (roleError) throw roleError;

      if (roleValue !== "citizen") {
        await supabase.auth.signOut();
        throw new Error("This sign in form is only for citizens.");
      }

      onClose();
      router.push(nextPath ?? "/");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupEmailContinue = () => {
    if (!isValidEmail(signupEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    const normalized = signupEmail.trim().toLowerCase();
    setSignupEmail(normalized);
    setEmailMasked(maskEmail(normalized));
    setOtpCode("");
    setErrorMessage(null);
    setCurrentStep("verify_otp");
  };

  const handleVerifyOtp = () => {
    if (otpCode.length !== 6) {
      setErrorMessage("Please enter the 6-digit verification code.");
      return;
    }

    setErrorMessage(null);
    setCurrentStep("complete_profile");
  };

  const handleResendCode = () => {
    // TODO: Connect to a server endpoint/provider for OTP resend when available.
    setErrorMessage(null);
  };

  const handleCreateAccount = async () => {
    if (!signupEmail) {
      setErrorMessage("Please provide your email first.");
      setCurrentStep("signup_email");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Please complete your first and last name.");
      return;
    }

    if (!barangay || !city || !province) {
      setErrorMessage("Please choose your barangay, city, and province.");
      return;
    }

    if (signupPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const supabase = supabaseBrowser();
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/confirm` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
            access: {
              role: "citizen",
              locale: barangay.trim().toLowerCase(),
              city: city.trim(),
              province: province.trim(),
            },
          },
        },
      });

      if (error) throw error;

      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error("Account already exists. Please log in.");
      }

      onClose();
      router.push("/sign-up-success");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  const formPanel = (() => {
    if (currentStep === "login") {
      return (
        <CitizenLoginStep
          titleId={titleId}
          descriptionId={descriptionId}
          email={loginEmail}
          password={loginPassword}
          errorMessage={errorMessage}
          isLoading={isLoading}
          onEmailChange={setLoginEmail}
          onPasswordChange={setLoginPassword}
          onSubmit={handleLogin}
        />
      );
    }

    if (currentStep === "signup_email") {
      return (
        <CitizenSignupEmailStep
          titleId={titleId}
          descriptionId={descriptionId}
          email={signupEmail}
          errorMessage={errorMessage}
          isLoading={isLoading}
          onEmailChange={setSignupEmail}
          onSubmit={handleSignupEmailContinue}
        />
      );
    }

    if (currentStep === "verify_otp") {
      return (
        <CitizenVerifyOtpStep
          titleId={titleId}
          descriptionId={descriptionId}
          emailMasked={emailMasked}
          code={otpCode}
          errorMessage={errorMessage}
          isLoading={isLoading}
          onCodeChange={setOtpCode}
          onSubmit={handleVerifyOtp}
          onResendCode={handleResendCode}
        />
      );
    }

    return (
      <CitizenCompleteProfileStep
        titleId={titleId}
        descriptionId={descriptionId}
        firstName={firstName}
        lastName={lastName}
        barangay={barangay}
        city={city}
        province={province}
        password={signupPassword}
        errorMessage={errorMessage}
        isLoading={isLoading}
        barangayOptions={GEO_OPTIONS.barangays}
        cityOptions={GEO_OPTIONS.cities}
        provinceOptions={GEO_OPTIONS.provinces}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        onBarangayChange={setBarangay}
        onCityChange={setCity}
        onProvinceChange={setProvince}
        onPasswordChange={setSignupPassword}
        onSubmit={handleCreateAccount}
      />
    );
  })();

  return (
    <CitizenAuthSplitShell
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      titleId={titleId}
      descriptionId={descriptionId}
      formFirst={currentStep === "login"}
      formPanel={formPanel}
      brandPanel={
        <CitizenAuthBrandPanel
          variant={currentStep === "login" ? "signup_cta" : "login_cta"}
          onToggleAuth={toggleMode}
        />
      }
    />
  );
}
