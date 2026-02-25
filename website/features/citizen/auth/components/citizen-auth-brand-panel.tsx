"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { CitizenAuthVariant } from "@/features/citizen/auth/types";

type CitizenAuthBrandPanelProps = {
  variant: CitizenAuthVariant;
  onToggleAuth: () => void;
};

const COPY = {
  signup_cta: {
    title: "Not yet registered?",
    description: "Register to submit feedback on LGU programs and projects.",
    buttonLabel: "Sign Up",
    support: "Already serving your community through transparency.",
  },
  login_cta: {
    title: "Already have an account?",
    description: "Sign in to submit official feedback and monitor LGU projects.",
    buttonLabel: "Log In",
    support: "Access your account and continue your participation.",
  },
} as const;

export default function CitizenAuthBrandPanel({
  variant,
  onToggleAuth,
}: CitizenAuthBrandPanelProps) {
  const copy = COPY[variant];

  return (
    <aside className="relative flex h-full min-h-[320px] items-center justify-center overflow-hidden bg-[#022437] px-8 py-10 text-white md:px-10">
      <Image
        src="/login/building.png"
        alt=""
        fill
        className="object-cover object-center"
        sizes="(min-width: 768px) 50vw, 100vw"
        priority
      />
      <div className="absolute inset-0 bg-[#001925]/68" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#013146]/65 via-[#013146]/40 to-[#013146]/80"
        aria-hidden
      />
      <Image
        src="/login/faded-logo.png"
        alt=""
        width={360}
        height={360}
        className="pointer-events-none absolute -left-12 top-1/2 hidden -translate-y-1/2 opacity-30 lg:block"
        aria-hidden
      />
      <Image
        src="/citizen-dashboard/city.png"
        alt=""
        fill
        className="pointer-events-none object-cover object-bottom opacity-25"
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center gap-6 text-center">
        <h3 className="text-4xl font-bold leading-tight text-white">{copy.title}</h3>
        <p className="text-base leading-relaxed text-slate-100/90">{copy.description}</p>
        <Button
          type="button"
          onClick={onToggleAuth}
          className="h-12 w-full rounded-xl border border-cyan-400 bg-transparent text-base font-semibold text-cyan-300 hover:bg-cyan-500/10 focus-visible:ring-2 focus-visible:ring-[#0EA5C6]/40"
        >
          {copy.buttonLabel}
        </Button>
        <p className="text-sm text-slate-200/85">{copy.support}</p>

        <div className="mt-2 flex items-center gap-3">
          <Image
            src="/login/with-bg-logo.png"
            alt="OpenAIP icon"
            width={28}
            height={28}
            className="h-7 w-7 rounded-full"
          />
          <div className="text-left">
            <p className="text-4xl font-semibold leading-none">OpenAIP</p>
            <p className="text-sm text-slate-200/85">Transparency Portal</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
