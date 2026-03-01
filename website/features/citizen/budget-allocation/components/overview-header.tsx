type OverviewHeaderProps = {
  title: string;
  subtitle: string;
};

export default function OverviewHeader({ title, subtitle }: OverviewHeaderProps) {
  return (
    <header className="space-y-2">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="text-sm text-slate-600">{subtitle}</p>
    </header>
  );
}
