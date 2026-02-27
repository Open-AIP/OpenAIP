import Link from "next/link";
import { cn } from "@/lib/ui/utils";

type LandingFooterProps = {
  className?: string;
};

export default function LandingFooter({ className }: LandingFooterProps) {
  return (
    <footer className={cn("w-full border-t border-white/10 bg-[#053645]", className)}>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 md:grid-cols-3 md:px-10">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">OpenAIP</h3>
          <p className="max-w-xs text-sm leading-relaxed text-white/60">
            Public budgets and projects, presented clearly for every resident.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">Quick Links</h3>
          <nav className="flex flex-col gap-1.5 text-sm text-white/60">
            <Link href="/" className="transition hover:text-white">
              Dashboard
            </Link>
            <Link href="/aips" className="transition hover:text-white">
              AIPs
            </Link>
            <Link href="/projects" className="transition hover:text-white">
              Projects
            </Link>
          </nav>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">Contact</h3>
          <div className="space-y-1 text-sm text-white/60">
            <p>City Hall, Cabuyao</p>
            <p>Laguna, Philippines</p>
            <p>info@cabuyao.gov.ph</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
