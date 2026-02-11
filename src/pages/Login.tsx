import { SignIn } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function LoginPage() {
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
				<SignIn
					forceRedirectUrl="/dashboard"
					signUpUrl="/signup"
					appearance={{
						elements: {
							formButtonPrimary:
								"bg-emerald-400 hover:bg-emerald-300 text-black shadow-[0_12px_40px_rgba(52,211,153,0.35)]",
							card: "bg-white/10 backdrop-blur-xl border-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.45)]",
							headerTitle: "text-white",
							headerSubtitle: "text-zinc-400",
							socialButtonsBlockButton:
								"bg-white/10 border-white/10 text-white hover:bg-white/20",
							socialButtonsBlockButtonText: "text-white",
							formFieldLabel: "text-zinc-300",
							formFieldInput:
								"bg-black/40 border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-400/60",
							footerActionLink: "text-emerald-300 hover:text-emerald-200",
							identityPreviewText: "text-white",
							identityPreviewEditButton: "text-emerald-300",
							formFieldInputShowPasswordButton:
								"text-zinc-400 hover:text-zinc-300",
							dividerLine: "bg-white/10",
							dividerText: "text-zinc-400",
						},
					}}
				/>
			</div>
		</div>
	);
}
