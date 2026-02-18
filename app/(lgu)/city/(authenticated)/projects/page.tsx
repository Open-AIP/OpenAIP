import IncompleteRoutePlaceholder from "@/components/layout/incomplete-route-placeholder";

export default function CityProjectsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Projects</h1>
      <IncompleteRoutePlaceholder
        title="Choose a project category"
        description="Use the health or infrastructure project routes to manage project details and updates."
        ctaHref="/city/projects/health"
        ctaLabel="Open Health Projects"
      />
    </section>
  );
}
