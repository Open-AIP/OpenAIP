'use client';

import Image from 'next/image';

export default function HeroSection() {
  return (
    <div className="w-full relative [background:linear-gradient(180deg,_#d3dbe0,_#fff_99.15%)] overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mt-6 rounded-md overflow-hidden relative bg-cover bg-center" style={{ height: 220 }}>
          <Image
            src="/images/hero-city.jpg"
            alt="Budget Allocation Hero"
            fill
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[rgba(3,59,92,0.35)]" />
          <div className="relative z-10 p-8 md:p-12">
            <h1 className="text-5xl md:text-6xl font-baskervville-sc text-white tracking-wide">Budget Allocation</h1>
            <p className="mt-3 max-w-3xl text-sm text-powderblue">Explore approved budget allocations by service category and project for the selected LGU and fiscal year</p>
          </div>
        </div>
      </div>
    </div>
  );
}
