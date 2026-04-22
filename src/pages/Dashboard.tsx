import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
	ArrowRight,
	Building2,
	FileCheck2,
	MapPinned,
	ShieldAlert,
	Wrench,
} from "lucide-react";
import ActionQueue from "../components/dashboard/ActionQueue";
import ActivityTimeline from "../components/dashboard/ActivityTimeline";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import FootfallSnapshot from "../components/dashboard/FootfallSnapshot";
import KPIGrid from "../components/dashboard/KPIGrid";
import RiskAlertPanel from "../components/dashboard/RiskAlertPanel";
import SiteStatusMap from "../components/dashboard/SiteStatusMap";
import {
	approvalsAPI,
	dashboardAPI,
	incidentsAPI,
	setAuthTokenProvider,
	sitesAPI,
	usersAPI,
} from "../services/api";
import type {
	CurrentUserProfile,
	DashboardOverview,
	DashboardScope,
	SiteSummary,
} from "../types/dashboard";

const EMPTY_OVERVIEW: DashboardOverview = {
	kpis: {
		totalSites: 0,
		highRiskSites: 0,
		activeIncidents: 0,
		pendingApprovals: 0,
		conservationOngoing: 0,
		visitorCapacity: 0,
	},
	incidentsBySeverity: {
		LOW: 0,
		MEDIUM: 0,
		HIGH: 0,
	},
	footfallTrend: [],
	recentActivity: [],
	regionSummary: [],
	criticalAlerts: [],
	pendingApprovals: [],
};

const extractId = (value: unknown): string => {
	if (typeof value === "string") {
		return value;
	}

	if (value && typeof value === "object" && "_id" in value) {
		return extractId((value as { _id?: unknown })._id);
	}

	return "";
};

const buildDateRangeLabel = () => {
	const end = new Date();
	const start = new Date();
	start.setDate(end.getDate() - 6);

	const format = (date: Date) =>
		date.toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
		});

	return `${format(start)} - ${format(end)}`;
};

const Dashboard: React.FC = () => {
	const [scope, setScope] = useState<DashboardScope>("national");
	const [selectedState, setSelectedState] = useState("");
	const [selectedSiteId, setSelectedSiteId] = useState("");
	const [allSites, setAllSites] = useState<SiteSummary[]>([]);
	const [currentUser, setCurrentUser] = useState<CurrentUserProfile | null>(null);
	const [dashboardData, setDashboardData] = useState<DashboardOverview>(EMPTY_OVERVIEW);
	const [loading, setLoading] = useState(true);
	const [contextReady, setContextReady] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { isLoaded, getToken } = useAuth();

	useEffect(() => {
		if (!isLoaded) {
			return;
		}

		setAuthTokenProvider(() => getToken());
		return () => setAuthTokenProvider(null);
	}, [getToken, isLoaded]);

	const stateOptions = useMemo(
		() =>
			Array.from(new Set(allSites.map((site) => site.state))).sort((left, right) =>
				left.localeCompare(right),
			),
		[allSites],
	);

	const siteOptions = useMemo(() => {
		if (!selectedState) {
			return allSites;
		}

		return allSites.filter((site) => site.state === selectedState);
	}, [allSites, selectedState]);

	const selectedSite = useMemo(
		() => allSites.find((site) => site._id === selectedSiteId) || null,
		[allSites, selectedSiteId],
	);

	const headerTitle = useMemo(() => {
		if (scope === "national") {
			return "National Operations Dashboard";
		}

		if (scope === "state") {
			return selectedState
				? `${selectedState} Operations Dashboard`
				: "State Operations Dashboard";
		}

		return selectedSite?.name || "Site Operations Dashboard";
	}, [scope, selectedState, selectedSite]);

	const headerSubtitle = useMemo(() => {
		if (scope === "national") {
			return "All monitored heritage sites";
		}

		if (scope === "state") {
			return selectedState
				? `${siteOptions.length} monitored sites in ${selectedState}`
				: "Select a state to continue";
		}

		return selectedSite
			? `${selectedSite.district}, ${selectedSite.state}`
			: "Select a site to continue";
	}, [scope, selectedState, selectedSite, siteOptions.length]);

	const fetchDashboardData = useCallback(async () => {
		if (!isLoaded || !contextReady) {
			return;
		}

		if (scope === "state" && !selectedState) {
			setDashboardData(EMPTY_OVERVIEW);
			return;
		}

		if (scope === "site" && !selectedSiteId) {
			setDashboardData(EMPTY_OVERVIEW);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const { data } = await dashboardAPI.getOverview({
				scope,
				state: scope === "state" || scope === "site" ? selectedState : undefined,
				siteId: scope === "site" ? selectedSiteId : undefined,
			});
			setDashboardData(data);
		} catch (dashboardError: any) {
			setError(
				dashboardError?.response?.data?.message || "Failed to load dashboard data.",
			);
		} finally {
			setLoading(false);
		}
	}, [contextReady, isLoaded, scope, selectedSiteId, selectedState]);

	useEffect(() => {
		if (!isLoaded) {
			return;
		}

		let cancelled = false;

		const initializeDashboard = async () => {
			setLoading(true);
			setError(null);

			try {
				const [sitesResponse, meResponse] = await Promise.all([
					sitesAPI.getAll({ limit: 1000 }),
					usersAPI.getMe(),
				]);

				if (cancelled) {
					return;
				}

				const sites = sitesResponse.data?.sites || [];
				const user = meResponse.data as CurrentUserProfile;
				const preferredSiteId = extractId(user.siteId) || extractId(user.stateId);
				const preferredSite =
					sites.find((site: SiteSummary) => site._id === preferredSiteId) ||
					sites[0] ||
					null;
				const defaultScope: DashboardScope =
					user.role === "SITE_OFFICER"
						? "site"
						: user.role === "STATE_ADMIN"
							? "state"
							: "national";

				setAllSites(sites);
				setCurrentUser(user);
				setScope(defaultScope);
				setSelectedState((current) => current || preferredSite?.state || "");
				setSelectedSiteId((current) => current || preferredSite?._id || "");
				setContextReady(true);
			} catch (contextError: any) {
				if (!cancelled) {
					setError(
						contextError?.response?.data?.message ||
							"Failed to initialize dashboard.",
					);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		initializeDashboard();

		return () => {
			cancelled = true;
		};
	}, [isLoaded]);

	useEffect(() => {
		if (!allSites.length) {
			setSelectedSiteId("");
			return;
		}

		if (!selectedState) {
			setSelectedState(allSites[0].state);
			return;
		}

		const matchingSites = allSites.filter((site) => site.state === selectedState);

		if (matchingSites.length === 0) {
			setSelectedSiteId("");
			return;
		}

		if (!matchingSites.some((site) => site._id === selectedSiteId)) {
			setSelectedSiteId(matchingSites[0]._id);
		}
	}, [allSites, selectedSiteId, selectedState]);

	useEffect(() => {
		fetchDashboardData();
	}, [fetchDashboardData]);

	const handleApprovalReview = useCallback(
		async (approvalId: string, status: "APPROVED" | "REJECTED", reviewNotes: string) => {
			await approvalsAPI.review(approvalId, { status, reviewNotes });
			await fetchDashboardData();
		},
		[fetchDashboardData],
	);

	const handleIncidentRespond = useCallback(
		async (incidentId: string) => {
			await incidentsAPI.update(incidentId, { status: "IN_PROGRESS" });
			await fetchDashboardData();
		},
		[fetchDashboardData],
	);

	if (!isLoaded || (loading && !contextReady)) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-stone-50">
				<div className="text-center">
					<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-stone-900"></div>
					<p className="text-stone-600">Loading dashboard...</p>
				</div>
			</div>
		);
	}

	if (error && !contextReady) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
				<div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
					<h2 className="font-semibold text-red-800">Unable to load dashboard</h2>
					<p className="mt-2 text-sm text-red-600">{error}</p>
					<button
						onClick={() => window.location.reload()}
						className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_30%),linear-gradient(180deg,_#f8f5ef_0%,_#f3efe7_45%,_#f8f7f4_100%)] text-stone-900">
			<DashboardHeader
				scope={scope}
				title={headerTitle}
				subtitle={headerSubtitle}
				dateRangeLabel={buildDateRangeLabel()}
				stateOptions={stateOptions}
				selectedState={selectedState}
				siteOptions={siteOptions}
				selectedSiteId={selectedSiteId}
				criticalCount={dashboardData.incidentsBySeverity.HIGH}
				activeRole={currentUser?.role}
				onScopeChange={setScope}
				onStateChange={setSelectedState}
				onSiteChange={setSelectedSiteId}
				onAlertClick={() => {
					document
						.getElementById("critical-alerts")
						?.scrollIntoView({ behavior: "smooth", block: "start" });
				}}
			/>

			<main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">
				<section className="grid gap-5 xl:grid-cols-[1.4fr_0.95fr]">
					<div className="overflow-hidden rounded-[30px] border border-stone-200/80 bg-[linear-gradient(135deg,_rgba(24,24,27,0.98),_rgba(41,37,36,0.94)_52%,_rgba(120,53,15,0.82))] p-6 text-white shadow-[0_24px_80px_rgba(28,25,23,0.22)]">
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div className="max-w-2xl">
								<p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">
									Operations Portal
								</p>
								<h2 className="mt-3 font-serif text-4xl leading-none sm:text-5xl">
									Monitor risk, workload, and field response from one command deck.
								</h2>
								<p className="mt-4 max-w-xl text-sm leading-6 text-stone-200/88 sm:text-base">
									Use the dashboard to move from national posture to state and site
									context, then act on the entities that need attention first.
								</p>
							</div>
							<div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-stone-100 backdrop-blur">
								<p className="text-[11px] uppercase tracking-[0.22em] text-stone-300">
									Live posture
								</p>
								<p className="mt-2 text-2xl font-semibold">
									{dashboardData.kpis.highRiskSites > 0 ? "Elevated" : "Stable"}
								</p>
								<p className="mt-2 text-xs text-stone-300">
									{dashboardData.kpis.highRiskSites} high-risk sites and{" "}
									{dashboardData.kpis.activeIncidents} active incidents in scope.
								</p>
							</div>
						</div>

						<div className="mt-6 grid gap-3 sm:grid-cols-3">
							<div className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur">
								<p className="text-[11px] uppercase tracking-[0.22em] text-stone-300">
									Coverage
								</p>
								<p className="mt-3 text-3xl font-semibold">
									{dashboardData.kpis.totalSites}
								</p>
								<p className="mt-2 text-sm text-stone-300">
									Heritage sites visible in the current scope.
								</p>
							</div>
							<div className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur">
								<p className="text-[11px] uppercase tracking-[0.22em] text-stone-300">
									Action queue
								</p>
								<p className="mt-3 text-3xl font-semibold">
									{dashboardData.kpis.pendingApprovals}
								</p>
								<p className="mt-2 text-sm text-stone-300">
									Pending approvals waiting for review.
								</p>
							</div>
							<div className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur">
								<p className="text-[11px] uppercase tracking-[0.22em] text-stone-300">
									Field work
								</p>
								<p className="mt-3 text-3xl font-semibold">
									{dashboardData.kpis.conservationOngoing}
								</p>
								<p className="mt-2 text-sm text-stone-300">
									Ongoing conservation programs underway.
								</p>
							</div>
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
						<Link
							to="/sites"
							className="group rounded-[26px] border border-stone-200/85 bg-white/92 p-5 shadow-[0_18px_50px_rgba(120,113,108,0.12)] backdrop-blur transition-transform hover:-translate-y-0.5">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-xs uppercase tracking-[0.22em] text-stone-500">
										Sites
									</p>
									<h3 className="mt-3 text-xl font-semibold text-stone-950">
										Manage heritage records
									</h3>
									<p className="mt-2 text-sm text-stone-600">
										Create, update, archive, and restore site inventory.
									</p>
								</div>
								<div className="rounded-2xl bg-stone-900 p-3 text-white">
									<Building2 className="h-5 w-5" />
								</div>
							</div>
							<div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-stone-900">
								Open sites workspace
								<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
							</div>
						</Link>

						<div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
							<Link
								to="/incidents"
								className="rounded-[24px] border border-red-100 bg-red-50/90 p-4 text-red-900 shadow-[0_16px_40px_rgba(248,113,113,0.12)]">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-xs uppercase tracking-[0.22em] text-red-500">
											Incidents
										</p>
										<p className="mt-2 text-2xl font-semibold">
											{dashboardData.kpis.activeIncidents}
										</p>
									</div>
									<ShieldAlert className="h-5 w-5 text-red-500" />
								</div>
								<p className="mt-3 text-sm text-red-700/80">Triage live operational issues.</p>
							</Link>

							<Link
								to="/conservation"
								className="rounded-[24px] border border-emerald-100 bg-emerald-50/90 p-4 text-emerald-950 shadow-[0_16px_40px_rgba(16,185,129,0.12)]">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-xs uppercase tracking-[0.22em] text-emerald-600">
											Conservation
										</p>
										<p className="mt-2 text-2xl font-semibold">
											{dashboardData.kpis.conservationOngoing}
										</p>
									</div>
									<Wrench className="h-5 w-5 text-emerald-600" />
								</div>
								<p className="mt-3 text-sm text-emerald-800/80">
									Track restoration delivery.
								</p>
							</Link>

							<Link
								to="/approvals"
								className="rounded-[24px] border border-amber-100 bg-amber-50/90 p-4 text-amber-950 shadow-[0_16px_40px_rgba(245,158,11,0.14)]">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-xs uppercase tracking-[0.22em] text-amber-600">
											Approvals
										</p>
										<p className="mt-2 text-2xl font-semibold">
											{dashboardData.kpis.pendingApprovals}
										</p>
									</div>
									<FileCheck2 className="h-5 w-5 text-amber-600" />
								</div>
								<p className="mt-3 text-sm text-amber-800/80">
									Clear the highest-priority requests.
								</p>
							</Link>
						</div>
					</div>
				</section>

				{error ? (
					<div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 shadow-sm">
						{error}
					</div>
				) : null}

				<section>
					<KPIGrid scope={scope} kpis={dashboardData.kpis} />
				</section>

				<section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<div className="lg:col-span-2">
						<SiteStatusMap
							scope={scope}
							regionSummary={dashboardData.regionSummary}
						/>
					</div>
					<div className="lg:col-span-1">
						<RiskAlertPanel
							scope={scope}
							incidentsBySeverity={dashboardData.incidentsBySeverity}
							alerts={dashboardData.criticalAlerts}
							onRespond={handleIncidentRespond}
						/>
					</div>
				</section>

				<section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
					<div className="xl:col-span-2">
						<ActionQueue
							approvals={dashboardData.pendingApprovals}
							currentUserRole={currentUser?.role}
							onReview={handleApprovalReview}
						/>
					</div>
					<div className="flex flex-col gap-6 xl:col-span-1">
						<div className="h-64">
							<FootfallSnapshot
								scope={scope}
								footfallTrend={dashboardData.footfallTrend}
							/>
						</div>
						<div className="min-h-80 flex-1">
							<ActivityTimeline
								scope={scope}
								recentActivity={dashboardData.recentActivity}
							/>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
};

export default Dashboard;
