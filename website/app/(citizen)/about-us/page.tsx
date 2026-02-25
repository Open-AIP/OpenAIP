"use client";

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Building2,
  FileCheck2,
  FileText,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CitizenExplainerCard from '@/features/citizen/components/citizen-explainer-card';
import CitizenPageHero from '@/features/citizen/components/citizen-page-hero';

const featureCards = [
  {
    title: 'Interactive Dashboards',
    description: 'See priorities at a glance with intuitive summaries and visual breakdowns.',
    icon: BarChart3,
  },
  {
    title: 'Sector Breakdowns',
    description: 'Understand allocations by sector, location, and community needs.',
    icon: Layers,
  },
  {
    title: 'Funding Allocations',
    description: 'Track where funds are planned and how budgets are distributed.',
    icon: ShieldCheck,
  },
  {
    title: 'Project Timelines',
    description: 'View planned outputs, timelines, and implementation windows.',
    icon: FileCheck2,
  },
];

const legalBasis = [
  {
    label: 'Law',
    title: 'Republic Act No. 7160 (Local Government Code of 1991)',
    items: [
      'Mandates planning-linked budgeting and development investment.',
      'Sec. 305: budgets operationalize approved development plans.',
      'Sec. 287: 20% of NTA for development projects.',
      'Sec. 17(b): devolved basic services responsibility.',
    ],
    accent: 'border-[#3B82F6] text-[#1D4ED8] bg-[#EFF6FF]',
    line: 'bg-[#3B82F6]',
  },
  {
    label: 'Memorandum',
    title: 'Local Budget Memorandum (LBM No. 92, FY 2026)',
    items: [
      'Requires total resource AIP preparation.',
      'Prescribes official AIP templates and compliance rules.',
      'Mandates statutory allocations and climate tagging.',
    ],
    accent: 'border-[#3B82F6] text-[#1D4ED8] bg-[#EFF6FF]',
    line: 'bg-[#3B82F6]',
  },
  {
    label: 'Allocations',
    title: 'Other statutory allocations reflected in AIPs include',
    chips: [
      '20% Development Fund',
      '5% DRRM Fund',
      '5% GAD Budget',
      '10% SK Fund',
      'PWDs',
      'Children',
      'Public Health',
      'Senior Citizens',
    ],
    accent: 'border-[#22C55E] text-[#166534] bg-[#ECFDF5]',
    line: 'bg-[#22C55E]',
  },
];

const referenceDocs = [
  {
    title: 'DBM Primer Cover',
    file: 'Source: DBM',
    href: '/mock/sample.pdf',
  },
  {
    title: 'RA 7160',
    file: 'Source: Official Code',
    href: '/mock/sample.pdf',
  },
  {
    title: 'LBM No. 92, FY 2026',
    file: 'Source: DBM',
    href: '/mock/sample.pdf',
  },
];

const citizenQuestions = [
  {
    title: 'What projects will be implemented this year?',
    image: '/mock/health/health1.jpg',
  },
  {
    title: 'How much is allocated to each sector?',
    image: '/mock/health/health2.jpg',
  },
  {
    title: 'Which office is responsible?',
    image: '/mock/health/health3.jpg',
  },
  {
    title: 'What outputs are expected and how are mandatory funds used?',
    image: '/mock/health/health4.jpg',
  },
];

export default function AboutUsPage() {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible((v) => ({ ...v, [e.target.id]: true }));
          }
        });
      },
      { threshold: 0.2 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const openPdf = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="space-y-12 pb-8 bg-[#F9FAFB]">
      <CitizenPageHero
        title="About Us"
        subtitle="Explore how your city or barangay plans to use public funds for programs, projects, and community development throughout the year."
        eyebrow="Transparency Platform"
        imageSrc="/default/default-no-image.jpg"
      />

      <CitizenExplainerCard title="What is OpenAIP?">
        <p className="text-sm leading-relaxed text-slate-600 md:text-[15px]">
          OpenAIP transforms Local Government Unit Annual Investment Plans from static documents into searchable,
          visual, and understandable public information so communities can better follow and engage with local planning.
        </p>
      </CitizenExplainerCard>

      {/* Section 1: What is OpenAIP */}
      <section
        id="what"
        ref={(el) => { sectionRefs.current['what'] = el }}
        className="mx-auto w-full max-w-6xl"
      >
        <Card className="border border-slate-100 bg-[#F3F5F7] shadow-sm">
          <CardContent className="grid gap-8 px-8 py-8 md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              <Badge className="bg-[#022437] text-white">Transparency Platform</Badge>
              <h2 className={`mt-2 text-2xl font-semibold text-slate-900 transition-all ${visible['what'] ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                What is OpenAIP?
              </h2>
              <p className={`text-sm font-semibold text-[#05C7F2] transition-opacity delay-150 ${visible['what'] ? 'opacity-100' : 'opacity-0'}`}>
                Turning AIP PDFs into citizen-readable open data.
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                OpenAIP transforms Local Government Unit (LGU) Annual Investment Plans from static PDF documents into
                structured, searchable, and visual open data. By converting complex budget information into accessible
                formats, we make local government planning transparent and understandable to all citizens.
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                The platform provides real-time insights into how public funds are allocated across sectors, programs,
                and projects, empowering communities to actively participate in local governance.
              </p>
              <p className="mt-3 text-sm font-semibold text-[#05C7F2]">Transparency that&apos;s not only procedural - <span className="font-semibold">but understandable.</span></p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">Official AIP Documents</Badge>
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">Standardized Templates</Badge>
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">Citizen-Friendly Visuals</Badge>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featureCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className={`rounded-xl border border-slate-100 bg-white p-4 shadow-sm transform transition-all duration-400 ${
                      visible['what'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: `${50 * featureCards.indexOf(card)}ms` }}
                  >
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#022437]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">{card.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section 3: Dashboard preview (static mock with callouts) */}
      <section
        id="dashboard"
        ref={(el) => { sectionRefs.current['dashboard'] = el }}
        className="mx-auto w-full max-w-6xl space-y-6 rounded-[28px] bg-[#EEF2F6] px-6 py-8 shadow-sm md:px-10"
      >
        <div className="flex flex-col gap-6 md:flex-row">
          <div className={`flex-1 transition-transform ${visible['dashboard'] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}`}>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <Image src="/mock/dashboard-preview.jpg" alt="Dashboard preview" width={920} height={420} className="rounded-md object-cover" />
            </div>
          </div>
          <div className={`w-full md:w-80 transition-opacity ${visible['dashboard'] ? 'opacity-100' : 'opacity-0'}`}>
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-900">Sector Breakdowns</h4>
                <p className="mt-2 text-xs text-slate-600">Understand allocations by sector, location, and community needs.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-900">Funding Allocations</h4>
                <p className="mt-2 text-xs text-slate-600">Track where funds are planned and how budgets are distributed.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-900">Project Timelines</h4>
                <p className="mt-2 text-xs text-slate-600">View planned outputs, timelines, and implementation windows.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 text-sm text-slate-700">Background tint shifts to indicate credible evidence.</div>
      </section>

      {/* Section 4: Legal basis and verified sources */}
      <section
        id="legal"
        ref={(el) => { sectionRefs.current['legal'] = el }}
        className="mx-auto w-full max-w-6xl space-y-6"
      >
        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
          <div className="space-y-4">
            {legalBasis.map((section) => (
              <div key={section.title} className="relative">
                <div className={`absolute left-0 top-0 h-full w-1 rounded-full ${section.line}`} />
                <Card className={`border border-slate-200 bg-white transition-transform ${visible['legal'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                  <CardContent className="space-y-4 px-6 py-5">
                    <span className={`absolute -top-3 left-4 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${section.accent}`}>
                      {section.label}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                    {section.items ? (
                      <ul className="list-disc space-y-2 pl-4 text-xs text-slate-600">
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    {section.chips ? (
                      <div className="flex flex-wrap gap-2">
                        {section.chips.map((chip) => (
                          <Badge key={chip} className="border border-[#BFDBFE] bg-[#E6F0FF] text-[11px] font-medium text-[#1E3A8A]">{chip}</Badge>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            ))}
            <div className="rounded-xl border-l-4 border-[#3B82F6] bg-white px-6 py-5 text-xs text-slate-600 shadow-sm">
              <span className="block text-sm font-semibold text-slate-900">&ldquo;The AIP serves as the legal bridge between planning and public expenditure.&rdquo;</span>
            </div>
          </div>

          <Card className={`h-fit border border-slate-200 bg-white transition-opacity ${visible['legal'] ? 'opacity-100' : 'opacity-0'}`}>
            <CardContent className="space-y-4 px-6 py-6">
              <div className="space-y-2">
                <Badge className="rounded-full bg-[#166534] text-[11px] font-semibold text-white">Verified Sources</Badge>
                <h3 className="text-base font-semibold text-slate-900">Reference Documents</h3>
              </div>
              <div className="space-y-3">
                {referenceDocs.map((doc) => (
                  <div key={doc.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-[#1C4F9D]">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-900">{doc.title}</p>
                        <p className="text-[11px] text-slate-500">{doc.file}</p>
                        <Button onClick={() => openPdf(doc.href)} variant="outline" size="sm" className="h-7 border-[#BFDBFE] bg-[#EFF6FF] px-3 text-[11px] text-[#1D4ED8] hover:bg-[#DBEAFE]">
                          View PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="why" ref={(el) => { sectionRefs.current['why'] = el }} className="mx-auto w-full max-w-6xl space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900">Why the AIP Matters to Citizens</h2>
          <p className="mt-2 text-xs text-slate-500">The AIP answers essential accountability questions:</p>
        </div>

        <div className="space-y-3">
          {citizenQuestions.map((q, idx) => (
            <details
              key={q.title}
              className={`group rounded-2xl border border-slate-200 bg-white p-4 transition-all ${
                visible['why'] ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-slate-900">
                <span>{q.title}</span>
                <span className="text-xs text-slate-500">{visible['why'] ? 'Tap to expand' : ''}</span>
              </summary>
              <div className="mt-3 text-xs text-slate-600">
                {idx === 0 && <p>OpenAIP lets you browse projects by sector, location, and budget size in seconds.</p>}
                {idx === 1 && <p>OpenAIP surfaces allocation summaries so you can compare sectors and totals quickly.</p>}
                {idx === 2 && <p>OpenAIP links projects to implementing offices and contact points to improve accountability.</p>}
                {idx === 3 && <p>OpenAIP highlights expected outputs and tracks mandated fund usage for transparency.</p>}
              </div>
            </details>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/90 px-6 py-5 text-center text-xs text-slate-600">
          Since all public expenditures must be supported by appropriations anchored in the AIP, understanding this
          document means understanding how public money is planned and spent. <span className="font-semibold text-[#0E7490]">OpenAIP ensures that transparency is not only procedural, but practical and understandable.</span>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-[18px] border border-[#0A4A9E] bg-gradient-to-b from-[#0E5AC5] via-[#0B4EA5] to-[#07396F] px-6 py-8 text-white shadow-xl md:px-10">
          <div className="relative z-10 text-center">
            <h2 className="text-xl font-semibold">Ready to Explore Your LGU&apos;s AIP?</h2>
            <p className="mt-2 text-xs text-white/80">Discover how your local government plans to invest in your community</p>
            <Button asChild className="mt-5 h-8 rounded-full bg-white px-4 text-[11px] font-semibold text-[#0B4EA5] hover:bg-slate-100">
              <Link href="/aips">Explore Your LGU&apos;s AIP <span aria-hidden="true">→</span></Link>
            </Button>
          </div>

          <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">View Interactive Dashboard</p>
                <p className="text-[10px] text-white/70">Explore budget data visually</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Compare Budget Allocations</p>
                <p className="text-[10px] text-white/70">Analyze spending across sectors</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Browse AIP Documents</p>
                <p className="text-[10px] text-white/70">Monitor project implementation</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Explore Local Projects</p>
                <p className="text-[10px] text-white/70">Browse planned projects and updates</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-6 border-t border-white/15 pt-3 text-center text-[10px] text-white/70">• Based on official AIP documents and prescribed templates •</div>
        </div>
      </section>
    </section>
  );
}
