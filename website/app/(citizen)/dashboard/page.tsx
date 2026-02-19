import CitizenHero from '@/features/citizen/components/CitizenHero';

const CitizenDashboardPage = () => {
  return (
    <section aria-labelledby="dashboard-title" className="space-y-6">
      <h1 id="dashboard-title" className="sr-only">
        Dashboard
      </h1>
      <CitizenHero />
    </section>
  );
};

export default CitizenDashboardPage;
