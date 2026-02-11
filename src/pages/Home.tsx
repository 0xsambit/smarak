import { useRef, useEffect } from "react";
import {
	ArrowRight,
	BarChart3,
	Clock,
	Globe,
	Landmark,
	Shield,
	Users,
	TrendingUp,
	MapPin,
	CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

const heritageImages = [
	"/img1.webp",
	"/img2.webp",
	"/img3.webp",
	"/img4.webp",
	"/img5.webp",
	"/img6.webp",
];

export default function Home() {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (videoRef.current) {
			videoRef.current.playbackRate = 0.75;
		}
	}, []);

	return (
		<div className="relative min-h-screen bg-black text-white overflow-x-hidden">
			{/* Navigation */}
			<nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-black/30 border-b border-white/5">
				<div className="mx-auto max-w-7xl flex items-center justify-between">
					<Link to="/" className="flex items-center gap-3 text-xl">
						<span className="instrument-serif-regular font-semibold">Smarak</span>
					</Link>
					<div className="hidden md:flex items-center gap-8 text-sm instrument-sans-normal">
						<a
							href="#features"
							className="text-zinc-400 hover:text-white transition">
							Features
						</a>
						<a
							href="#about"
							className="text-zinc-400 hover:text-white transition">
							About
						</a>
						<a
							href="#testimonials"
							className="text-zinc-400 hover:text-white transition">
							Partners
						</a>
					</div>
					<div className="flex items-center gap-3">
						<SignedOut>
							<Link
								to="/login"
								className="instrument-sans-normal text-sm px-4 py-2 text-zinc-300 hover:text-white transition">
								Log in
							</Link>
							<Link
								to="/signup"
								className="instrument-sans-semibold text-sm px-4 py-2 bg-emerald-400 text-black rounded hover:bg-emerald-300 transition">
								Sign up
							</Link>
						</SignedOut>
						<SignedIn>
							<Link
								to="/dashboard"
								className="instrument-sans-normal text-sm px-4 py-2 text-zinc-300 hover:text-white transition">
								Dashboard
							</Link>
							<UserButton afterSignOutUrl="/" />
						</SignedIn>
					</div>
				</div>
			</nav>

			{/* Hero Section with Video Background */}
			<section className="relative min-h-screen flex items-center justify-center overflow-hidden">
				<video
					ref={videoRef}
					autoPlay
					muted
					loop
					playsInline
					className="absolute inset-0 w-full h-full object-cover">
					<source src="/bg_vid.mp4" type="video/mp4" />
				</video>
				<div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/50 to-black" />

				<div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
					<div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 backdrop-blur-sm mb-6">
						<CheckCircle2 className="size-4" />
						<span className="instrument-sans-normal">
							Live Beta – Now accepting ASI partners
						</span>
					</div>
					<h1 className="instrument-serif-regular text-5xl md:text-7xl lg:text-8xl leading-tight">
						Smarak
					</h1>
					<p className="mt-4 text-2xl md:text-3xl text-zinc-300 instrument-serif-regular-italic">
						Built for the Modern Era of Heritage Management
					</p>
					<p className="mt-8 text-lg md:text-xl text-zinc-400 instrument-sans-normal max-w-3xl mx-auto">
						Empower your team with real-time analytics, streamlined operations,
						and comprehensive visitor management for India's precious heritage
						sites.
					</p>
					<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link
							to="/signup"
							className="group instrument-sans-semibold flex items-center gap-2 bg-emerald-400 text-black px-8 py-4 text-sm tracking-wide rounded-lg shadow-[0_20px_60px_rgba(52,211,153,0.3)] hover:bg-emerald-300 transition">
							Get Started Free
							<ArrowRight className="size-4 transition group-hover:translate-x-1" />
						</Link>
						<Link
							to="/login"
							className="instrument-sans-semibold flex items-center gap-2 border border-white/20 bg-white/5 text-white px-8 py-4 text-sm tracking-wide rounded-lg backdrop-blur-sm hover:bg-white/10 transition">
							Sign In
						</Link>
					</div>
					<p className="mt-6 text-sm text-zinc-500 instrument-sans-normal">
						Trusted by Archaeological Survey of India • No credit card required
					</p>
				</div>

				{/* Scroll indicator */}
				<div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
					<div className="w-px h-12 bg-linear-to-b from-transparent via-white/50 to-white/20" />
				</div>
			</section>

			{/* Stats */}
			<section className="relative py-16 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
						{[
							{ label: "Heritage Sites", value: "3,600+" },
							{ label: "Daily Visitors", value: "500K+" },
							{ label: "ASI Partners", value: "120+" },
							{ label: "Uptime", value: "99.9%" },
						].map((stat) => (
							<div
								key={stat.label}
								className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-b from-white/5 to-transparent p-6 backdrop-blur-sm hover:border-emerald-400/30 transition">
								<div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-emerald-500/10 blur-2xl" />
								<div className="relative">
									<div className="text-3xl md:text-4xl font-bold text-white instrument-sans-bold">
										{stat.value}
									</div>
									<div className="mt-1 text-sm text-zinc-400 instrument-sans-normal">
										{stat.label}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="relative py-24 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="instrument-serif-regular text-4xl md:text-6xl">
							Everything You Need to Manage
							<br />
							<span className="text-emerald-400 instrument-serif-regular-italic">
								Heritage Operations
							</span>
						</h2>
						<p className="mt-6 text-lg text-zinc-400 instrument-sans-normal">
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
									<h3 className="mt-4 text-xl font-semibold text-white instrument-sans-semibold">
										{feature.title}
									</h3>
									<p className="mt-2 text-sm text-zinc-400 leading-relaxed instrument-sans-normal">
										{feature.description}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Heritage Showcase with Videos */}
			<section id="about" className="relative py-24 px-6 bg-zinc-950">
				<div className="max-w-7xl mx-auto">
					<div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
						<div>
							<h2 className="instrument-serif-regular text-4xl md:text-6xl leading-tight">
								Real-Time Monitoring
								<br />
								<span className="text-zinc-500 instrument-serif-regular-italic">
									Across All Sites
								</span>
							</h2>
							<p className="mt-6 text-lg text-zinc-400 instrument-sans-normal">
								Track visitor flows, staff activities, and site conditions
								in real-time. Make data-driven decisions with comprehensive
								analytics and insights.
							</p>
						</div>
						<div className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
							<video
								autoPlay
								muted
								loop
								playsInline
								className="w-full h-full object-cover">
								<source src="/shot1.mp4" type="video/mp4" />
							</video>
						</div>
					</div>

					<div className="grid lg:grid-cols-2 gap-16 items-center">
						<div className="order-2 lg:order-1 relative aspect-video rounded-lg overflow-hidden border border-white/10">
							<video
								autoPlay
								muted
								loop
								playsInline
								className="w-full h-full object-cover">
								<source src="/shot2.mp4" type="video/mp4" />
							</video>
						</div>
						<div className="order-1 lg:order-2">
							<h2 className="instrument-serif-regular text-4xl md:text-6xl leading-tight">
								Smart Operations
								<br />
								<span className="text-zinc-500 instrument-serif-regular-italic">
									Automated & Efficient
								</span>
							</h2>
							<p className="mt-6 text-lg text-zinc-400 instrument-sans-normal">
								Streamline ticketing, capacity management, and maintenance
								scheduling. Optimize operations with intelligent automation
								and predictive insights.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Partner Heritage Sites */}
			<section id="testimonials" className="relative py-24 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="instrument-serif-regular text-4xl md:text-6xl mb-6">
							Trusted by India's
							<br />
							<span className="text-emerald-400 instrument-serif-regular-italic">
								Heritage Custodians
							</span>
						</h2>
						<p className="text-lg text-zinc-400 instrument-sans-normal max-w-3xl mx-auto">
							Join Archaeological Survey of India and leading tourism partners
							in modernizing heritage site management across the nation.
						</p>
					</div>

					{/* Heritage Site Images */}
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
						{heritageImages.map((img, index) => (
							<div
								key={index}
								className="relative aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-emerald-400/30 transition-all duration-300 hover:scale-105">
								<img
									src={img}
									alt={`Heritage site ${index + 1}`}
									className="w-full h-full object-cover"
								/>
							</div>
						))}
					</div>

					{/* Trust Badges */}
					<div className="grid md:grid-cols-3 gap-8 mt-16">
						{[
							{
								icon: CheckCircle2,
								title: "ASI Certified",
								description:
									"Official partner of Archaeological Survey of India",
							},
							{
								icon: Shield,
								title: "Secure & Compliant",
								description: "Meets government security and data standards",
							},
							{
								icon: MapPin,
								title: "Pan-India Coverage",
								description: "Supporting heritage sites across all states",
							},
						].map((item) => (
							<div key={item.title} className="flex gap-4 items-start">
								<div className="shrink-0 p-3 rounded-xl bg-emerald-400/10">
									<item.icon className="size-6 text-emerald-400" />
								</div>
								<div>
									<div className="font-semibold text-white instrument-sans-semibold text-lg">
										{item.title}
									</div>
									<div className="mt-1 text-sm text-zinc-400 instrument-sans-normal">
										{item.description}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative py-32 px-6 bg-zinc-950">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="instrument-serif-regular text-4xl md:text-6xl text-white mb-6">
						Ready to Transform Your
						<br />
						<span className="text-emerald-400 instrument-serif-regular-italic">
							Heritage Management?
						</span>
					</h2>
					<p className="text-lg text-zinc-400 instrument-sans-normal max-w-2xl mx-auto mb-12">
						Join leading heritage sites across India. Start your free trial today.
						No credit card required.
					</p>

					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link
							to="/signup"
							className="group instrument-sans-semibold inline-flex items-center gap-2 bg-emerald-400 text-black px-8 py-4 text-sm tracking-wide rounded-lg shadow-[0_20px_60px_rgba(52,211,153,0.3)] hover:bg-emerald-300 transition">
							Get Started Now
							<ArrowRight className="size-4 transition group-hover:translate-x-1" />
						</Link>
						<Link
							to="/login"
							className="instrument-sans-normal inline-flex items-center gap-2 border border-white/20 bg-white/5 text-white px-8 py-4 text-sm rounded-lg backdrop-blur-sm hover:bg-white/10 transition">
							Schedule Demo
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="relative border-t border-zinc-800 py-16 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="grid md:grid-cols-4 gap-12">
						{/* Brand */}
						<div>
							<Link to="/" className="flex items-center gap-3 text-xl">
								<Landmark className="size-6 text-emerald-400" />
								<span className="instrument-serif-regular font-semibold">
									Smarak
								</span>
							</Link>
							<p className="mt-4 text-zinc-500 instrument-sans-normal text-sm">
								Modern heritage site management for India's precious
								monuments.
							</p>
						</div>

						{/* Product */}
						<div>
							<h4 className="text-sm font-semibold text-white instrument-sans-semibold mb-4">
								Product
							</h4>
							<div className="space-y-3">
								<a
									href="#features"
									className="block text-sm text-zinc-400 hover:text-white transition instrument-sans-normal">
									Features
								</a>
								<a
									href="#about"
									className="block text-sm text-zinc-400 hover:text-white transition instrument-sans-normal">
									About
								</a>
								<a
									href="#testimonials"
									className="block text-sm text-zinc-400 hover:text-white transition instrument-sans-normal">
									Partners
								</a>
								<Link
									to="/signup"
									className="block text-sm text-zinc-400 hover:text-white transition instrument-sans-normal">
									Get Started
								</Link>
							</div>
						</div>

						{/* Support */}
						<div>
							<h4 className="text-sm font-semibold text-white instrument-sans-semibold mb-4">
								Support
							</h4>
							<div className="space-y-3">
								<a
									href="#"
									className="block text-sm text-zinc-400 hover:text-white transition instrument-sans-normal">
									Documentation
								</a>
								<a
									href="#"
									className="block text-sm text-zinc-400 hover:text-white transition instrument-sans-normal">
									Help Center
								</a>
								<a
									href="#"
									className="block text-sm text-zinc-400 hover:text-white transition instrument-sans-normal">
									Contact Us
								</a>
								<a
									href="#"
									className="block text-sm text-zinc-400 hover:text-white transition instrument-sans-normal">
									Status
								</a>
							</div>
						</div>

						{/* Legal */}
						<div>
							<h4 className="text-sm font-semibold text-white instrument-sans-semibold mb-4">
								Legal
							</h4>
							<div className="space-y-3">
								<a
									href="/privacy"
									className="block text-sm text-zinc-400 hover:text-white transition instrument-sans-normal">
									Privacy Policy
								</a>
								<a
									href="/terms"
									className="block text-sm text-zinc-400 hover:text-white transition instrument-sans-normal">
									Terms of Service
								</a>
								<a
									href="#"
									className="block text-sm text-zinc-400 hover:text-white transition instrument-sans-normal">
									Security
								</a>
							</div>
						</div>
					</div>

					<div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
						<p className="text-sm text-zinc-500 instrument-sans-normal">
							© 2026 Smarak. All rights reserved.
						</p>
						<div className="flex items-center gap-2 text-sm text-zinc-500 instrument-sans-normal">
							<Shield className="size-4 text-emerald-400" />
							<span>ASI Partner Network</span>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
