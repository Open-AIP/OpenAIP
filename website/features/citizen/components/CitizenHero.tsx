import HeroSection from '@/features/citizen/components/HeroSection';

export default function CitizenHero() {
  return (
    <HeroSection
      title={'Know Where\nEvery Peso Goes.'}
      subtitle="Explore the Annual Investment Plan through clear budget breakdowns, sector allocations, and funded projects - presented with transparency and accountability."
      ctaLabel="Explore the AIP"
      ctaHref="/aips"
      backgroundImageSrc="/citizen-dashboard/flag.jpg"
      scrollHintLabel="Scroll to explore"
    />
  );
}
