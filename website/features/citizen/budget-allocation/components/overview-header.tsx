type OverviewHeaderProps = {
  title: string;
  subtitle: string;
};

export default function OverviewHeader({ title, subtitle }: OverviewHeaderProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-12 text-center">
      <h2 className="text-3xl font-semibold text-[#022437] md:text-4xl">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
    </section>
  );
}
