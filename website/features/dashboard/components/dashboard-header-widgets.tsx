import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardHeader({
  title,
  q = "",
  selectedFiscalYear,
  availableFiscalYears = [],
  kpiMode = "summary",
}: {
  title: string;
  q?: string;
  selectedFiscalYear?: number;
  availableFiscalYears?: number[];
  kpiMode?: "summary" | "operational";
}) {
  const resolvedYear = selectedFiscalYear ?? new Date().getFullYear();
  const yearOptions = availableFiscalYears.length > 0 ? availableFiscalYears : [resolvedYear];

  return (
    <div className="w-full space-y-6">
      <h1 className="text-5xl font-bold text-foreground">{title}</h1>
      <form method="get" className="flex items-center justify-between gap-4">
        <input type="hidden" name="kpi" value={kpiMode} />
        <div className="relative w-full max-w-[360px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            name="q"
            defaultValue={q}
            placeholder="Global search..."
            className="h-10 w-full rounded-lg border-0 bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Global search"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Year:</span>
          <div className="relative">
            <select
              name="year"
              defaultValue={String(resolvedYear)}
              className="h-10 w-[120px] appearance-none rounded-lg border-0 bg-secondary px-3 pr-8 text-sm text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Select Year"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-70" aria-hidden />
          </div>
        </div>
      </form>
    </div>
  );
}

export function GlobalSearchWidget({
  value = "",
  onChange,
  onSubmit,
}: {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(value);
      }}
      className="relative h-8 w-[272px] rounded-lg bg-secondary"
      aria-label="Global Search"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder="Global search..."
        className="h-full w-full rounded-lg bg-transparent pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Global search"
      />
    </form>
  );
}

export function YearDropdownWidget({
  label = "Year:",
  value,
  options,
  onChange,
}: {
  label?: string;
  value: number | string;
  options: Array<number | string>;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="relative h-8 w-[115.2px] rounded-lg bg-secondary hover:bg-secondary/80">
        <select
          value={String(value)}
          onChange={(event) => onChange?.(event.target.value)}
          className="h-full w-full appearance-none rounded-lg bg-transparent px-3 pr-8 text-left text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Select Year"
        >
          {options.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-70" aria-hidden />
      </div>
    </div>
  );
}

export function DateCard({ label, backgroundImageUrl }: { label: string; backgroundImageUrl?: string }) {
  const parsed = new Date(label);
  const hasDate = !Number.isNaN(parsed.getTime());
  const dayNumber = hasDate ? parsed.toLocaleDateString("en-PH", { day: "2-digit" }) : "--";
  const weekday = hasDate ? parsed.toLocaleDateString("en-PH", { weekday: "long" }).toUpperCase() : "TODAY";
  const monthYear = hasDate
    ? parsed.toLocaleDateString("en-PH", { month: "long", year: "numeric" }).toUpperCase()
    : label.toUpperCase();

  return (
    <Card
      className="relative h-[79px] overflow-hidden rounded-xl border-0 py-0"
    >
      {backgroundImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={backgroundImageUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/60 to-foreground/40" />
      <CardContent className="relative p-5">
        <div className="flex items-center gap-3 text-primary-foreground">
          <div className="font-[var(--font-heading)] text-5xl font-semibold leading-none">{dayNumber}</div>
          <div className="min-w-0">
            <div className="truncate font-[var(--font-sans)] text-sm leading-relaxed">{weekday}</div>
            <div className="truncate font-[var(--font-sans)] text-sm leading-relaxed">{monthYear}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkingOnCard({ items }: { items: Array<{ id: string; label: string; href: string }> }) {
  return (
    <Card className="rounded-xl border border-border bg-card py-0 text-card-foreground">
      <CardHeader className="p-5 pb-0"><CardTitle className="text-sm font-medium">You&apos;re Working On</CardTitle></CardHeader>
      <CardContent className="p-5 space-y-3">
        {items.length === 0 ? (
          <div className="mt-10 text-center text-xl font-semibold">All Caught Up</div>
        ) : (
          items.map((item) => (
            <Link key={item.id} href={item.href} className="block rounded-lg border border-border bg-card p-3 text-sm text-card-foreground hover:bg-accent">
              {item.label}
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
