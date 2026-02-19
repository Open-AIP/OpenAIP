import Link from 'next/link';

export default function CitizenFooter() {
  return (
    <footer className="mt-12 border-t border-[#0f3448] bg-[#022437] text-slate-200">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-3 md:px-8">
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold text-white">Cabuyao AIP Portal</h3>
          <p className="text-base leading-relaxed text-slate-300">
            Promoting transparent and accountable local governance through accessible Annual Investment Program
            information.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-semibold text-white">Quick Links</h3>
          <nav className="flex flex-col gap-2 text-base text-slate-300">
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
            <Link href="/aips" className="hover:text-white">
              AIPs
            </Link>
            <Link href="/budget-allocation" className="hover:text-white">
              Budget Allocation
            </Link>
            <Link href="/projects/health" className="hover:text-white">
              Health Projects
            </Link>
            <Link href="/projects/infrastructure" className="hover:text-white">
              Infrastructure Projects
            </Link>
          </nav>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-semibold text-white">Contact Information</h3>
          <div className="space-y-2 text-base text-slate-300">
            <p>City Hall, Cabuyao City</p>
            <p>Laguna, Philippines 4025</p>
            <p>Email: info@cabuyao.gov.ph</p>
            <p>Tel: (049) 123-4567</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#17485f] px-4 py-4 text-center text-sm text-slate-400 md:px-8">
        <p>(c) 2026 City Government of Cabuyao. All rights reserved.</p>
        <p className="mt-1">Empowering citizens through transparency and participation.</p>
      </div>
    </footer>
  );
}

