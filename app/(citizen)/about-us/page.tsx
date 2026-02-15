import Image from 'next/image';
import Link from 'next/link';
import {
	BarChart3,
	Building2,
	FileCheck2,
	FileText,
	Layers,
	ShieldCheck,
	Users,
} from 'lucide-react';
import CitizenSectionBanner from '@/features/citizen/components/CitizenSectionBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
		title: 'Republic Act No. 7160 (Local Government Code of 1991)',
		items: [
			'Mandates planning-linked budgeting and development investment.',
			'Sec. 305: budgets operationalize approved development plans.',
			'Sec. 287: 20% of NTA for development projects.',
			'Sec. 17(b): devolved basic services responsibility.',
		],
		accent: 'bg-[#0E7490] text-white',
	},
	{
		title: 'Local Budget Memorandum (LBM No. 92, FY 2026)',
		items: [
			'Requires total resource AIP preparation.',
			'Prescribes official AIP templates and compliance rules.',
			'Mandates statutory allocations and climate tagging.',
		],
		accent: 'bg-[#1E40AF] text-white',
	},
	{
		title: 'Other statutory allocations reflected in AIPs include',
		chips: ['20% Development Fund', '5% DRRM Fund', '5% GAD Budget', '10% SK Fund', 'PWDs'],
		accent: 'bg-[#16A34A] text-white',
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
	return (
		<section className="space-y-12 pb-8">
			<CitizenSectionBanner
				title="About Us"
				description="Explore how your city or barangay plans to use public funds for programs, projects, and community development throughout the year."
				imageSrc="/default/default-no-image.jpg"
				className="rounded-[22px] border border-[#0B3F77]"
			/>

			<section className="mx-auto w-full max-w-6xl">
				<Card className="border-slate-200 bg-white/80 shadow-lg">
					<CardContent className="grid gap-8 px-8 py-8 md:grid-cols-[1.2fr_1fr]">
						<div className="space-y-4">
							<Badge className="bg-[#0E7490] text-white">Transparency Platform</Badge>
							<h2 className="text-2xl font-semibold text-slate-900">What is OpenAIP?</h2>
							<p className="text-sm font-semibold text-[#0E7490]">
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
							<div className="flex flex-wrap gap-2 pt-2">
								<Badge variant="outline" className="border-slate-200 text-slate-600">
									Official AIP Documents
								</Badge>
								<Badge variant="outline" className="border-slate-200 text-slate-600">
									Standardized Templates
								</Badge>
								<Badge variant="outline" className="border-slate-200 text-slate-600">
									Citizen-Friendly Visuals
								</Badge>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							{featureCards.map((card) => {
								const Icon = card.icon;
								return (
									<div
										key={card.title}
										className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
									>
										<div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#0E7490]">
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

			<section className="mx-auto w-full max-w-6xl space-y-6">
				<div className="inline-flex items-center gap-2">
					<Badge className="bg-[#0E7490] text-white">Legal Basis</Badge>
					<h2 className="text-xl font-semibold text-slate-900">Legal and Policy Basis of the AIP</h2>
				</div>

				<div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
					<div className="space-y-4">
						{legalBasis.map((section) => (
							<Card key={section.title} className="border-slate-200 bg-white/90">
								<CardContent className="space-y-4 px-6 py-5">
									<span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${section.accent}`}>
										Law
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
												<Badge key={chip} variant="outline" className="border-slate-200 text-slate-600">
													{chip}
												</Badge>
											))}
										</div>
									) : null}
								</CardContent>
							</Card>
						))}
						<div className="rounded-xl border border-slate-200 bg-white/80 px-6 py-5 text-xs text-slate-600">
							<span className="block text-sm font-semibold text-slate-900">"The AIP serves as the legal bridge between planning and public expenditure."</span>
						</div>
					</div>

					<Card className="h-fit border-slate-200 bg-white/90">
						<CardContent className="space-y-4 px-6 py-6">
							<div className="flex items-center justify-between">
								<div>
									<Badge className="bg-[#166534] text-white">Verified Sources</Badge>
									<h3 className="mt-2 text-sm font-semibold text-slate-900">Reference Documents</h3>
								</div>
								<FileText className="h-6 w-6 text-slate-400" />
							</div>
							<div className="space-y-3">
								{referenceDocs.map((doc) => (
									<div key={doc.title} className="rounded-lg border border-slate-100 bg-white p-4">
										<div className="flex items-start gap-3">
											<div className="mt-1 grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600">
												<FileText className="h-4 w-4" />
											</div>
											<div className="space-y-1">
												<p className="text-xs font-semibold text-slate-900">{doc.title}</p>
												<p className="text-[11px] text-slate-500">{doc.file}</p>
												<Button
													asChild
													variant="outline"
													size="sm"
													className="h-7 px-3 text-[11px]"
												>
													<Link href={doc.href}>View PDF</Link>
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

			<section className="mx-auto w-full max-w-6xl space-y-6">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-slate-900">Why the AIP Matters to Citizens</h2>
					<p className="mt-2 text-xs text-slate-500">The AIP answers essential accountability questions:</p>
				</div>
				<div className="grid gap-6 md:grid-cols-2">
					{citizenQuestions.map((card) => (
						<div key={card.title} className="group relative overflow-hidden rounded-2xl shadow-md">
							<Image src={card.image} alt={card.title} width={520} height={320} className="h-56 w-full object-cover" />
							<div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
							<div className="absolute inset-0 bg-gradient-to-t from-[#0B3F77]/70 via-[#0B3F77]/20 to-transparent" />
							<div className="absolute inset-x-0 bottom-0 p-4">
								<div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
									<Users className="h-4 w-4" />
								</div>
								<p className="mt-3 text-sm font-semibold text-white">{card.title}</p>
							</div>
						</div>
					))}
				</div>
				<div className="rounded-2xl border border-slate-200 bg-white/90 px-6 py-5 text-center text-xs text-slate-600">
					Since all public expenditures must be supported by appropriations anchored in the AIP, understanding this
					document means understanding how public money is planned and spent.{' '}
					<span className="font-semibold text-[#0E7490]">
						OpenAIP ensures that transparency is not only procedural, but practical and understandable.
					</span>
				</div>
			</section>

			<section className="mx-auto w-full max-w-6xl">
				<div className="relative overflow-hidden rounded-[26px] border border-[#0B3F77] bg-gradient-to-br from-[#0B3F77] via-[#0C4AA1] to-[#0B3F77] px-6 py-8 text-white shadow-xl md:px-10">
					<div className="pointer-events-none absolute inset-0">
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_55%)]" />
						<div className="absolute bottom-0 left-0 right-0 h-24 opacity-35 [background:repeating-linear-gradient(90deg,rgba(255,255,255,0.35)_0_12px,transparent_12px_24px)]" />
					</div>
					<div className="relative z-10 text-center">
						<Badge className="bg-white/15 text-white">Ready to Explore Your LGU's AIP?</Badge>
						<h2 className="mt-4 text-2xl font-semibold">Discover how your local government plans to invest in your community</h2>
						<Button asChild className="mt-6 bg-white text-[#0B3F77] hover:bg-slate-100">
							<Link href="/aips">Explore Your LGU's AIP</Link>
						</Button>
					</div>
					<div className="relative z-10 mt-8 grid gap-4 rounded-2xl bg-white/10 p-4 text-xs text-white/90 md:grid-cols-2">
						<div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
							<div className="grid h-9 w-9 place-items-center rounded-lg bg-white/20">
								<BarChart3 className="h-4 w-4" />
							</div>
							<div>
								<p className="font-semibold text-white">View Interactive Dashboard</p>
								<p className="text-[11px] text-white/70">See annual priorities visually</p>
							</div>
						</div>
						<div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
							<div className="grid h-9 w-9 place-items-center rounded-lg bg-white/20">
								<Layers className="h-4 w-4" />
							</div>
							<div>
								<p className="font-semibold text-white">Compare Budget Allocations</p>
								<p className="text-[11px] text-white/70">Analyze spending across sectors</p>
							</div>
						</div>
						<div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
							<div className="grid h-9 w-9 place-items-center rounded-lg bg-white/20">
								<FileText className="h-4 w-4" />
							</div>
							<div>
								<p className="font-semibold text-white">Browse AIP Documents</p>
								<p className="text-[11px] text-white/70">Review project documentation</p>
							</div>
						</div>
						<div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
							<div className="grid h-9 w-9 place-items-center rounded-lg bg-white/20">
								<Building2 className="h-4 w-4" />
							</div>
							<div>
								<p className="font-semibold text-white">Explore Local Projects</p>
								<p className="text-[11px] text-white/70">Discover planned programs and updates</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</section>
	);
}
