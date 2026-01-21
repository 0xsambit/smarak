import {
	ArrowRight,
	BarChart3,
	Clock,
	Globe,
	Landmark,
	Lock,
	Shield,
	Sparkles,
	Users,
	TrendingUp,
	MapPin,
	CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
	return (
		<div className="relative min-h-screen bg-linear-to-br from-black via-neutral-950 to-black text-white overflow-hidden">
			{/* Background effects */}
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(196,247,60,0.06),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(120,119,198,0.08),transparent_30%)]" />
			<div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_30%),linear-gradient(240deg,rgba(255,255,255,0.05),transparent_35%)]" />
			<div className="pointer-events-none absolute -left-64 top-32 size-96 rounded-full bg-emerald-500/10 blur-3xl" />
			<div className="pointer-events-none absolute -right-64 top-96 size-96 rounded-full bg-amber-400/10 blur-3xl" />

			{/* Navigation */}
			<nav className="relative z-20 border-b border-white/5 backdrop-blur-xl">
				<div className="mx-auto max-w-7xl px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3 text-xl text-emerald-200">
							<Landmark className="size-6" />
							<span className="font-semibold">Site Management SaaS</span>
						</div>
						<div className="flex items-center gap-3">
							<Link
								to="/login"
								className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition hover:text-white hover:bg-white/5">
								Log in
							</Link>
							<Link
								to="/signup"
								className="group flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300">
								Sign up
								<ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
							</Link>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-32">
				<div className="text-center">
					<div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 backdrop-blur-sm mb-6">
						<Sparkles className="size-4" />
						Live Beta – Now accepting ASI partners
					</div>
					<h1 className="mt-6 text-5xl md:text-7xl font-bold tracking-tight">
						Heritage Site Management
						<br />
						<span className="bg-linear-to-r from-emerald-400 via-emerald-300 to-amber-200 bg-clip-text text-transparent">
							Built for the Modern Era
						</span>
					</h1>
					<p className="mx-auto mt-8 max-w-2xl text-lg md:text-xl text-zinc-400 leading-relaxed">
						Empower your team with real-time analytics, streamlined operations,
						and comprehensive visitor management for India's precious heritage
						sites.
					</p>
					<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link
							to="/signup"
							className="group flex items-center gap-2 rounded-xl bg-emerald-400 px-8 py-4 text-lg font-semibold text-black shadow-[0_20px_60px_rgba(52,211,153,0.4)] transition hover:bg-emerald-300">
							Get Started Free
							<ArrowRight className="size-5 transition group-hover:translate-x-1" />
						</Link>
						<Link
							to="/login"
							className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">
							Sign In
						</Link>
					</div>
					<p className="mt-6 text-sm text-zinc-500">
						Trusted by Archaeological Survey of India • No credit card required
					</p>
				</div>

				{/* Stats */}
				<div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
					{[
						{ label: "Heritage Sites", value: "3,600+" },
						{ label: "Daily Visitors", value: "500K+" },
						{ label: "ASI Partners", value: "120+" },
						{ label: "Uptime", value: "99.9%" },
					].map((stat) => (
						<div
							key={stat.label}
							className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-b from-white/5 to-transparent p-6 backdrop-blur-sm">
							<div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-emerald-500/10 blur-2xl" />
							<div className="relative">
								<div className="text-3xl md:text-4xl font-bold text-white">
									{stat.value}
								</div>
								<div className="mt-1 text-sm text-zinc-400">
									{stat.label}
								</div>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Features Section */}
			<section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
				<div className="text-center mb-16">
					<h2 className="text-3xl md:text-5xl font-bold">
						Everything You Need to Manage
						<br />
						<span className="text-emerald-400">Heritage Operations</span>
					</h2>
					<p className="mt-4 text-lg text-zinc-400">
						Comprehensive tools designed for ASI administrators and tourism
						partners
					</p>
				</div>

				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[
						{
							icon: BarChart3,
							title: "Real-Time Analytics",
							description:
								"Track visitor flows, revenue, and site performance with live dashboards and intelligent insights.",
						},
						{
							icon: Users,
							title: "Staff Management",
							description:
								"Coordinate teams, manage schedules, and streamline communications across multiple heritage sites.",
						},
						{
							icon: Shield,
							title: "Security & Compliance",
							description:
								"Government-grade security with role-based access controls and audit trails for all operations.",
						},
						{
							icon: Clock,
							title: "Smart Operations",
							description:
								"Automate ticketing, capacity management, and maintenance schedules to optimize site operations.",
						},
						{
							icon: Globe,
							title: "Multi-Site Dashboard",
							description:
								"Monitor and manage multiple heritage sites from a single unified control panel.",
						},
						{
							icon: TrendingUp,
							title: "Predictive Insights",
							description:
								"AI-powered forecasting for visitor trends, maintenance needs, and resource allocation.",
						},
					].map((feature) => (
						<div
							key={feature.title}
							className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-b from-white/5 to-transparent p-8 backdrop-blur-sm transition hover:border-emerald-400/30">
							<div className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-emerald-500/0 blur-2xl transition group-hover:bg-emerald-500/10" />
							<div className="relative">
								<div className="inline-flex rounded-xl bg-emerald-400/10 p-3">
									<feature.icon className="size-6 text-emerald-400" />
								</div>
								<h3 className="mt-4 text-xl font-semibold text-white">
									{feature.title}
								</h3>
								<p className="mt-2 text-sm text-zinc-400 leading-relaxed">
									{feature.description}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Testimonial / Trust Section */}
			<section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
				<div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-white/10 via-white/5 to-black/40 p-12 md:p-16 backdrop-blur-xl">
					<div className="pointer-events-none absolute -left-32 -top-32 size-64 rounded-full bg-emerald-500/15 blur-3xl" />
					<div className="pointer-events-none absolute -right-24 -bottom-24 size-64 rounded-full bg-amber-400/15 blur-3xl" />
					<div className="relative">
						<div className="text-center">
							<MapPin className="inline-block size-12 text-emerald-400 mb-4" />
							<h2 className="text-3xl md:text-4xl font-bold text-white">
								Trusted by India's Heritage Custodians
							</h2>
							<p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
								Join Archaeological Survey of India and leading tourism
								partners in modernizing heritage site management across the
								nation.
							</p>
						</div>
						<div className="mt-12 grid md:grid-cols-3 gap-8">
							{[
								{
									title: "ASI Certified",
									description:
										"Official partner of Archaeological Survey of India",
								},
								{
									title: "Secure & Compliant",
									description:
										"Meets government security and data standards",
								},
								{
									title: "24/7 Support",
									description:
										"Dedicated support team for all ASI partners",
								},
							].map((item) => (
								<div key={item.title} className="flex gap-3">
									<CheckCircle2 className="size-6 text-emerald-400 shrink-0" />
									<div>
										<div className="font-semibold text-white">
											{item.title}
										</div>
										<div className="mt-1 text-sm text-zinc-400">
											{item.description}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative z-10 mx-auto max-w-7xl px-6 py-20 mb-20">
				<div className="text-center">
					<h2 className="text-4xl md:text-5xl font-bold text-white">
						Ready to Transform Your
						<br />
						<span className="text-emerald-400">Heritage Management?</span>
					</h2>
					<p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
						Start your free trial today. No credit card required.
					</p>
					<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link
							to="/signup"
							className="group flex items-center gap-2 rounded-xl bg-emerald-400 px-8 py-4 text-lg font-semibold text-black shadow-[0_20px_60px_rgba(52,211,153,0.4)] transition hover:bg-emerald-300">
							Get Started Now
							<ArrowRight className="size-5 transition group-hover:translate-x-1" />
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="relative z-10 border-t border-white/5 backdrop-blur-xl">
				<div className="mx-auto max-w-7xl px-6 py-12">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<div className="flex items-center gap-3 text-emerald-200">
							<Landmark className="size-5" />
							<span className="font-semibold">Site Management SaaS</span>
						</div>
						<div className="flex items-center gap-2 text-sm text-zinc-400">
							<span>© 2026 Site Management SaaS</span>
							<span>•</span>
							<span className="flex items-center gap-1">
								<Lock className="size-3" />
								ASI Partner Network
							</span>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
