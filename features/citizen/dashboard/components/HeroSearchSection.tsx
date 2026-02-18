import Image from "next/image";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CitizenDashboardFilters, CitizenScopeType } from "@/lib/repos/citizen-dashboard";
import type { CitizenDashboardLocationOption } from "@/lib/types/viewmodels/dashboard";
import { parseFiscalYear, parseScopeType } from "../utils";

type HeroSearchSectionProps = {
  scopeLabel: string;
  heroGradientClass: string;
  heroAccentClass: string;
  searchSurfaceClass: string;
  primaryButtonClass: string;
  locationOptions: CitizenDashboardLocationOption[];
  fiscalYearOptions: number[];
  draftFilters: CitizenDashboardFilters;
  onScopeChange: (scopeType: CitizenScopeType, scopeId: string) => void;
  onFiscalYearChange: (year: number) => void;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
};

export default function HeroSearchSection({
  scopeLabel,
  heroGradientClass,
  heroAccentClass,
  searchSurfaceClass,
  primaryButtonClass,
  locationOptions,
  fiscalYearOptions,
  draftFilters,
  onScopeChange,
  onFiscalYearChange,
  onSearchChange,
  onSubmit,
}: HeroSearchSectionProps) {
  return (
    <section className="relative">
      <div
        className={`relative overflow-hidden rounded-xl border border-slate-200 ${heroGradientClass} px-6 pb-20 pt-10 text-white shadow-xl md:px-10 md:pb-24 md:pt-12`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(255,255,255,0.15),transparent_45%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(to_top,rgba(1,18,48,0.95),rgba(1,18,48,0.25),transparent)]" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="grid h-24 w-24 place-items-center rounded-full border border-white/40 bg-white/10 backdrop-blur-sm md:h-28 md:w-28">
            <Image src="/brand/logo3.svg" alt="OpenAIP emblem" width={70} height={70} className="h-16 w-16 md:h-[72px] md:w-[72px]" />
          </div>
          <h1 className="mt-5 text-6xl font-semibold leading-none tracking-tight md:text-8xl">
            Open<span className={heroAccentClass}>AIP</span>
          </h1>
          <p className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">See Where Public Funds Go</p>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-slate-100 md:text-lg">
            Explore Annual Investment Programs (AIPs) of your city and barangay in a clear, easy-to-understand
            format. Track projects, budgets, and implementation status, empowering citizens with transparent access
            to local government investment plans.
          </p>
          <p className="mt-5 w-full text-left text-4xl font-semibold tracking-tight md:text-5xl">{scopeLabel}</p>
        </div>
      </div>

      <div className="absolute -bottom-8 left-1/2 z-20 w-full max-w-3xl -translate-x-1/2 px-4">
        <form
          className={`grid grid-cols-1 gap-2 rounded-full border border-slate-200 ${searchSurfaceClass} p-2 shadow-lg md:grid-cols-[1fr_170px_auto]`}
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Select
            value={`${draftFilters.scope_type}:${draftFilters.scope_id}`}
            onValueChange={(value) => {
              const [scopeType, scopeId] = value.split(":");
              onScopeChange(parseScopeType(scopeType), scopeId ?? "");
            }}
          >
            <SelectTrigger className="h-10 rounded-full border-slate-200 bg-white text-xs md:text-sm">
              <SelectValue placeholder="Choose Place" />
            </SelectTrigger>
            <SelectContent>
              {locationOptions.map((option) => (
                <SelectItem key={`${option.scope_type}:${option.value}`} value={`${option.scope_type}:${option.value}`}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-2">
            <Select
              value={String(draftFilters.fiscal_year)}
              onValueChange={(value) => onFiscalYearChange(parseFiscalYear(value))}
            >
              <SelectTrigger className="h-10 rounded-full border-slate-200 bg-white text-xs md:text-sm">
                <SelectValue placeholder="FY" />
              </SelectTrigger>
              <SelectContent>
                {fiscalYearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    FY {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={draftFilters.search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search"
              className="h-10 rounded-full border-slate-200 bg-white text-xs md:text-sm"
            />
          </div>

          <Button type="submit" className={`h-10 rounded-full px-6 ${primaryButtonClass}`}>
            <Search className="mr-1 h-4 w-4" />
            Search
          </Button>
        </form>
      </div>

      <div className="space-y-1 pt-3 text-center">
        <p className="text-sm text-[#0f5f90]">See how your city prioritizes infrastructure, healthcare, and services.</p>
        <p className="text-xs text-[#7ca3bd]">Scroll to explore</p>
      </div>
    </section>
  );
}
