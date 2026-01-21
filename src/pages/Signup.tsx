import { ArrowRight, Landmark, Lock, Mail, Sparkles, User, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function SignupPage() {
	return (
		<div className="relative min-h-screen bg-linear-to-br from-black via-neutral-950 to-black text-white">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(196,247,60,0.06),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(120,119,198,0.08),transparent_30%)]" />
			<div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_30%),linear-gradient(240deg,rgba(255,255,255,0.05),transparent_35%)]" />
			{/* Back to Home Link */}
			<Link
				to="/"
				className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 backdrop-blur-sm transition hover:text-white hover:bg-white/10">
				<Home className="size-4" />
				Back to Home
			</Link>
			<div className="relative z-10 mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12">
				<div className="w-full">
					<div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-white/10 via-white/5 to-black/40 p-10 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
						<div className="pointer-events-none absolute -left-32 -top-32 size-64 rounded-full bg-emerald-500/15 blur-3xl" />
						<div className="pointer-events-none absolute -right-24 -bottom-24 size-64 rounded-full bg-amber-400/15 blur-3xl" />
						<div className="pointer-events-none absolute inset-x-6 top-6 h-12 rounded-2xl border border-white/10" />

						<div className="flex items-center gap-3 text-xl text-emerald-200 justify-center">
							<Landmark className="size-5" /> Site Managment SaaS
						</div>
						<h1 className="mt-4 text-3xl font-semibold text-white">
							Create Account
						</h1>
						<p className="mt-2 text-sm text-zinc-400">
							Join ASI's trusted network for heritage site management and
							analytics.
						</p>

						<form className="mt-8 space-y-5">
							<label className="block space-y-2 text-sm">
								<span className="text-zinc-300">Full Name</span>
								<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 focus-within:border-emerald-400/60">
									<User className="size-5 text-emerald-300" />
									<input
										type="text"
										name="name"
										className="w-full bg-transparent text-white outline-none placeholder:text-zinc-500"
										placeholder="Dr. Rajesh Kumar"
										required
									/>
								</div>
							</label>

							<label className="block space-y-2 text-sm">
								<span className="text-zinc-300">Email address</span>
								<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 focus-within:border-emerald-400/60">
									<Mail className="size-5 text-emerald-300" />
									<input
										type="email"
										name="email"
										className="w-full bg-transparent text-white outline-none placeholder:text-zinc-500"
										placeholder="name@asi.gov.in"
										required
									/>
								</div>
							</label>

							<label className="block space-y-2 text-sm">
								<span className="text-zinc-300">Password</span>
								<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 focus-within:border-emerald-400/60">
									<Lock className="size-5 text-emerald-300" />
									<input
										type="password"
										name="password"
										className="w-full bg-transparent text-white outline-none placeholder:text-zinc-500"
										placeholder="••••••••"
										required
									/>
								</div>
							</label>

							<label className="block space-y-2 text-sm">
								<span className="text-zinc-300">Confirm Password</span>
								<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 focus-within:border-emerald-400/60">
									<Lock className="size-5 text-emerald-300" />
									<input
										type="password"
										name="confirmPassword"
										className="w-full bg-transparent text-white outline-none placeholder:text-zinc-500"
										placeholder="••••••••"
										required
									/>
								</div>
							</label>

							<div className="text-sm text-zinc-400">
								<label className="inline-flex items-center gap-2">
									<input
										type="checkbox"
										required
										className="h-4 w-4 rounded border-white/20 bg-white/10"
									/>
									I agree to the Terms of Service and Privacy Policy
								</label>
							</div>

							<button
								type="submit"
								className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-black font-semibold shadow-[0_12px_40px_rgba(52,211,153,0.35)] transition hover:bg-emerald-300">
								Create Account
								<ArrowRight className="size-4 transition group-hover:translate-x-1" />
							</button>

							<div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
								<span>Already have an account?</span>
								<Link
									to="/login"
									className="text-emerald-300 hover:text-emerald-200 cursor-pointer font-medium">
									Log in
								</Link>
							</div>

							<div className="flex items-center justify-between text-xs text-zinc-400">
								<span>Trusted access for ASI & tourism partners.</span>
								<span className="flex items-center gap-1 text-emerald-200">
									<Sparkles className="size-4" />
									Live beta
								</span>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}
