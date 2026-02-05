import React, { useState } from "react";
import { AlertCircle, Clock, ChevronRight } from "lucide-react";

type DashboardScope = "national" | "state" | "site";

interface Alert {
	id: string;
	site: string;
	type: string;
	daysOpen: number;
	priority: "High" | "Medium" | "Low";
}

const alertsByScope: Record<DashboardScope, Alert[]> = {
	national: [
		{
			id: "1",
			site: "Konark Sun Temple",
			type: "Structural Integrity Warning",
			daysOpen: 2,
			priority: "High",
		},
		{
			id: "2",
			site: "Red Fort",
			type: "Unauthorized Construction Nearby",
			daysOpen: 5,
			priority: "High",
		},
		{
			id: "3",
			site: "Hampi Complex",
			type: "Water Logging Report",
			daysOpen: 1,
			priority: "Medium",
		},
		{
			id: "4",
			site: "Ajanta Caves",
			type: "Security Camera Malfunction",
			daysOpen: 3,
			priority: "Medium",
		},
		{
			id: "5",
			site: "Taj Mahal",
			type: "Visitor Crowding Alert",
			daysOpen: 0,
			priority: "Low",
		},
	],
	state: [
		{
			id: "1",
			site: "Capital Heritage Park",
			type: "Monsoon seepage reported",
			daysOpen: 1,
			priority: "High",
		},
		{
			id: "2",
			site: "Riverfront Fort",
			type: "Crowd density threshold",
			daysOpen: 0,
			priority: "Medium",
		},
		{
			id: "3",
			site: "Heritage Museum",
			type: "CCTV maintenance overdue",
			daysOpen: 3,
			priority: "Medium",
		},
		{
			id: "4",
			site: "Hilltop Temple",
			type: "Structural inspection required",
			daysOpen: 2,
			priority: "High",
		},
	],
	site: [
		{
			id: "1",
			site: "North Gate",
			type: "Queue overflow alert",
			daysOpen: 0,
			priority: "High",
		},
		{
			id: "2",
			site: "Temple Complex",
			type: "Humidity threshold breach",
			daysOpen: 1,
			priority: "Medium",
		},
		{
			id: "3",
			site: "Perimeter Path",
			type: "Lighting system fault",
			daysOpen: 2,
			priority: "Low",
		},
	],
};

const RiskAlertPanel: React.FC<{ scope: DashboardScope }> = ({ scope }) => {
	const alerts = alertsByScope[scope];
	const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

	const closeModal = () => setSelectedAlert(null);
	return (
		<>
			<div className="bg-white border border-stone-200 rounded-lg shadow-sm h-100 flex flex-col">
				<div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
					<h3 className="font-serif text-stone-900 font-medium flex items-center gap-2">
						<AlertCircle className="w-4 h-4 text-stone-500" />
						Critical Alerts
					</h3>
					<span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
						{alerts.filter((a) => a.priority === "High").length} Critical
					</span>
				</div>

				<div className="flex-1 overflow-y-auto p-0">
					<div className="divide-y divide-stone-100">
						{alerts.map((alert) => (
							<div
								key={alert.id}
								className="p-4 hover:bg-stone-50 transition-colors group border-l-4 border-transparent hover:border-l-stone-400">
								<div className="flex justify-between items-start mb-1">
									<h4 className="text-sm font-semibold text-stone-800">
										{alert.site}
									</h4>
									<span
										className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
											alert.priority === "High"
												? "bg-red-50 text-red-700 border-red-100"
												: alert.priority === "Medium"
													? "bg-amber-50 text-amber-700 border-amber-100"
													: "bg-stone-100 text-stone-600 border-stone-200"
										}`}>
										{alert.priority}
									</span>
								</div>
								<p className="text-sm text-stone-600 mb-2">{alert.type}</p>
								<div className="flex items-center justify-between gap-4 text-xs text-stone-400">
									<div className="flex items-center gap-1">
										<Clock className="w-3 h-3" />
										<span>Open for {alert.daysOpen} days</span>
									</div>
									{alert.priority === "High" ? (
										<button
											onClick={() => setSelectedAlert(alert)}
											className="text-stone-500 hover:text-stone-900 flex items-center gap-1 font-medium transition-colors">
											View Detail{" "}
											<ChevronRight className="w-3 h-3" />
										</button>
									) : null}
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="p-3 border-t border-stone-100 bg-stone-50/30 text-center">
					<button className="text-xs font-medium text-stone-600 hover:text-stone-900 hover:underline">
						View All Alerts
					</button>
				</div>
			</div>

			{selectedAlert ? (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center"
					role="dialog"
					aria-modal="true"
					aria-labelledby="alert-detail-title">
					<button
						onClick={closeModal}
						className="absolute inset-0 bg-black/40"
						aria-label="Close alert details"
					/>
					<div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl border border-stone-200">
						<div className="flex items-start justify-between p-5 border-b border-stone-100">
							<div>
								<h3
									id="alert-detail-title"
									className="text-lg font-serif text-stone-900 font-medium">
									Critical Alert Details
								</h3>
								<p className="text-xs text-stone-500 mt-1">
									Scope:{" "}
									{scope === "national"
										? "National"
										: scope === "state"
											? "State"
											: "Site"}
								</p>
							</div>
							<button
								onClick={closeModal}
								className="text-stone-400 hover:text-stone-700 text-sm">
								Close
							</button>
						</div>
						<div className="p-5 space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<p className="text-xs uppercase tracking-wider text-stone-400">
										Site
									</p>
									<p className="text-sm font-semibold text-stone-900">
										{selectedAlert.site}
									</p>
								</div>
								<div>
									<p className="text-xs uppercase tracking-wider text-stone-400">
										Priority
									</p>
									<p className="text-sm font-semibold text-red-700">
										Critical
									</p>
								</div>
							</div>
							<div>
								<p className="text-xs uppercase tracking-wider text-stone-400">
									Issue
								</p>
								<p className="text-sm text-stone-700">
									{selectedAlert.type}
								</p>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<p className="text-xs uppercase tracking-wider text-stone-400">
										Open Duration
									</p>
									<p className="text-sm text-stone-700">
										{selectedAlert.daysOpen} days
									</p>
								</div>
								<div>
									<p className="text-xs uppercase tracking-wider text-stone-400">
										Recommended Action
									</p>
									<p className="text-sm text-stone-700">
										Dispatch inspection within 24 hours
									</p>
								</div>
							</div>
						</div>
						<div className="px-5 pb-5 flex justify-end gap-2">
							<button
								onClick={closeModal}
								className="px-3 py-1.5 text-sm rounded-md border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50">
								Close
							</button>
							<button className="px-3 py-1.5 text-sm rounded-md bg-stone-900 text-white hover:bg-stone-800">
								Assign Response Team
							</button>
						</div>
					</div>
				</div>
			) : null}
		</>
	);
};

export default RiskAlertPanel;
