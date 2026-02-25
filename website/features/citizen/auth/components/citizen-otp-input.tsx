"use client";

import { useMemo, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/ui/utils";

type CitizenOtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const OTP_LENGTH = 6;

export default function CitizenOtpInput({
  value,
  onChange,
  disabled = false,
}: CitizenOtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const cells = useMemo(
    () => Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? ""),
    [value]
  );

  const setDigitAt = (index: number, char: string) => {
    const next = cells.slice();
    next[index] = char;
    onChange(next.join(""));
  };

  const focusCell = (index: number) => {
    const safeIndex = Math.min(Math.max(index, 0), OTP_LENGTH - 1);
    refs.current[safeIndex]?.focus();
    refs.current[safeIndex]?.select();
  };

  const handleInputChange = (index: number, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "");

    if (!digits) {
      setDigitAt(index, "");
      return;
    }

    if (digits.length > 1) {
      const next = cells.slice();
      for (let cursor = index; cursor < OTP_LENGTH; cursor += 1) {
        const digit = digits[cursor - index];
        if (!digit) break;
        next[cursor] = digit;
      }
      onChange(next.join(""));
      focusCell(Math.min(index + digits.length, OTP_LENGTH - 1));
      return;
    }

    setDigitAt(index, digits[0]);
    if (index < OTP_LENGTH - 1) {
      focusCell(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      if (cells[index]) {
        setDigitAt(index, "");
        return;
      }
      if (index > 0) {
        setDigitAt(index - 1, "");
        focusCell(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusCell(index - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusCell(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pastedDigits) return;

    const next = Array.from({ length: OTP_LENGTH }, (_, index) => pastedDigits[index] ?? "");
    onChange(next.join(""));

    const nextFocusIndex = pastedDigits.length >= OTP_LENGTH ? OTP_LENGTH - 1 : pastedDigits.length;
    focusCell(nextFocusIndex);
  };

  return (
    <div
      className="flex items-center justify-center gap-2 md:gap-3"
      role="group"
      aria-label="One-time password input"
    >
      {cells.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          onChange={(event) => handleInputChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          className={cn(
            "h-14 w-12 rounded-lg border border-slate-300 bg-white text-center text-lg font-semibold text-[#052133]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5C6]/40 disabled:cursor-not-allowed disabled:opacity-60"
          )}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
