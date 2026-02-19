export default function AipBanner() {
  return (
    <section className="relative overflow-hidden rounded-none border border-[#063d7c] bg-gradient-to-r from-[#083a8c] via-[#0c4da5] to-[#0a3f8a] px-6 py-12 text-white shadow-sm md:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_45%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 opacity-40 [background:repeating-linear-gradient(90deg,rgba(255,255,255,0.35)_0_12px,transparent_12px_22px)]" />
      </div>

      <div className="relative z-10 text-center">
        <h1 className="text-4xl font-light uppercase tracking-[0.08em] md:text-6xl">Annual Investment Plans</h1>
        <p className="mx-auto mt-4 max-w-4xl text-sm text-slate-100 md:text-2xl">
          Explore how your city or barangay plans to use public funds for programs, projects, and community
          development throughout the year.
        </p>
      </div>
    </section>
  );
}
