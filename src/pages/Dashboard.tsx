import React, { useState } from "react";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import KPIGrid from "../components/dashboard/KPIGrid";
import SiteStatusMap from "../components/dashboard/SiteStatusMap";
import RiskAlertPanel from "../components/dashboard/RiskAlertPanel";
import ActionQueue from "../components/dashboard/ActionQueue";
import FootfallSnapshot from "../components/dashboard/FootfallSnapshot";
import ActivityTimeline from "../components/dashboard/ActivityTimeline";

type DashboardScope = "national" | "state" | "site";

const Dashboard: React.FC = () => {
	const [scope, setScope] = useState<DashboardScope>("national");

	return (
		<div className="min-h-screen bg-stone-50 font-sans text-stone-900">
			<DashboardHeader scope={scope} onScopeChange={setScope} />

			<main className="max-w-400 mx-auto p-6 space-y-6">
				{/* Section 1: KPIs */}
				<section>
					<KPIGrid scope={scope} />
				</section>

				{/* Section 2: Map & Risks */}
				<section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2">
						<SiteStatusMap scope={scope} />
					</div>
					<div className="lg:col-span-1">
						<RiskAlertPanel scope={scope} />
					</div>
				</section>

				{/* Section 3: Actions & Details */}
				<section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
					<div className="xl:col-span-2">
						<ActionQueue scope={scope} />
					</div>
					<div className="xl:col-span-1 flex flex-col gap-6">
						<div className="h-62.5">
							<FootfallSnapshot scope={scope} />
						</div>
						<div className="flex-1">
							<ActivityTimeline scope={scope} />
						</div>
					</div>
				</section>
			</main>
		</div>
	);
};

export default Dashboard;
