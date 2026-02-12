import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import KPIGrid from "../components/dashboard/KPIGrid";
import SiteStatusMap from "../components/dashboard/SiteStatusMap";
import RiskAlertPanel from "../components/dashboard/RiskAlertPanel";
import ActionQueue from "../components/dashboard/ActionQueue";
import FootfallSnapshot from "../components/dashboard/FootfallSnapshot";
import ActivityTimeline from "../components/dashboard/ActivityTimeline";
import { dashboardAPI, setAuthToken } from "../services/api";

type DashboardScope = "national" | "state" | "site";

interface DashboardData {
	kpis: {
		totalSites: number;
		highRiskSites: number;
		activeIncidents: number;
		pendingApprovals: number;
		conservationOngoing: number;
		visitorCapacity: number;
	};
	incidentsBySeverity: {
		LOW: number;
		MEDIUM: number;
		HIGH: number;
	};
	footfallTrend: Array<{ day: string; visitors: number }>;
	recentActivity: Array<{
		id: string;
		type: string;
		text: string;
		site: string;
		time: string;
		user: string;
	}>;
	regionSummary: Array<{
		name: string;
		sites: number;
		alerts: number;
		status: string;
	}>;
}

const Dashboard: React.FC = () => {
	const [scope, setScope] = useState<DashboardScope>("national");
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { isLoaded, getToken } = useAuth();

	// Fetch dashboard data
	const fetchDashboardData = async () => {
		if (!isLoaded) return;

		setLoading(true);
		setError(null);

		try {
			// Get Clerk token and set it in API headers
			const token = await getToken();
			console.log("🔑 Token obtained:", token ? "Yes" : "No");
			setAuthToken(token);

			// Fetch dashboard overview
			console.log("📡 Fetching dashboard data for scope:", scope);
			const { data } = await dashboardAPI.getOverview(scope);
			console.log("✅ Dashboard data received:", data);
			setDashboardData(data);
		} catch (err: any) {
			console.error("❌ Error fetching dashboard data:", err);
			console.error("Response:", err.response?.data);
			setError(err.response?.data?.message || "Failed to load dashboard data");
		} finally {
			setLoading(false);
		}
	};

	// Fetch data on mount and when scope changes
	useEffect(() => {
		fetchDashboardData();
	}, [isLoaded, scope]);

	// Handle scope change
	const handleScopeChange = (newScope: DashboardScope) => {
		setScope(newScope);
	};

	if (!isLoaded || loading) {
		return (
			<div className="min-h-screen bg-stone-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
					<p className="text-stone-600">Loading dashboard...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-stone-50 flex items-center justify-center">
				<div className="text-center max-w-md">
					<div className="bg-red-50 border border-red-200 rounded-lg p-6">
						<h2 className="text-red-800 font-semibold mb-2">
							Error Loading Dashboard
						</h2>
						<p className="text-red-600 text-sm mb-4">{error}</p>
						<button
							onClick={fetchDashboardData}
							className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
							Retry
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-stone-50 font-sans text-stone-900">
			<DashboardHeader scope={scope} onScopeChange={handleScopeChange} />

			<main className="max-w-400 mx-auto p-6 space-y-6">
				{/* Section 1: KPIs */}
				<section>
					<KPIGrid scope={scope} kpis={dashboardData?.kpis} />
				</section>

				{/* Section 2: Map & Risks */}
				<section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2">
						<SiteStatusMap
							scope={scope}
							regionSummary={dashboardData?.regionSummary}
						/>
					</div>
					<div className="lg:col-span-1">
						<RiskAlertPanel
							scope={scope}
							incidentsBySeverity={dashboardData?.incidentsBySeverity}
						/>
					</div>
				</section>

				{/* Section 3: Actions & Details */}
				<section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
					<div className="xl:col-span-2">
						<ActionQueue scope={scope} />
					</div>
					<div className="xl:col-span-1 flex flex-col gap-6">
						<div className="h-62.5">
							<FootfallSnapshot
								scope={scope}
								footfallTrend={dashboardData?.footfallTrend}
							/>
						</div>
						<div className="flex-1">
							<ActivityTimeline
								scope={scope}
								recentActivity={dashboardData?.recentActivity}
							/>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
};

export default Dashboard;
