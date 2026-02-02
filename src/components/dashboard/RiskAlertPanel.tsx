import React from "react";
import { AlertCircle, Clock, ChevronRight } from "lucide-react";

interface Alert {
	id: string;
	site: string;
	type: string;
	daysOpen: number;
	priority: "High" | "Medium" | "Low";
}

const alerts: Alert[] = [
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
	{ id: "5", site: "Taj Mahal", type: "Visitor Crowding Alert", daysOpen: 0, priority: "Low" },
];

const RiskAlertPanel: React.FC = () => {
	return (
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
							className="p-4 hover:bg-stone-50 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-l-stone-400">
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
							<div className="flex items-center gap-4 text-xs text-stone-400">
								<div className="flex items-center gap-1">
									<Clock className="w-3 h-3" />
									<span>Open for {alert.daysOpen} days</span>
								</div>
								<span className="opacity-0 group-hover:opacity-100 text-stone-500 flex items-center gap-1 font-medium transition-opacity">
									View Details <ChevronRight className="w-3 h-3" />
								</span>
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
	);
};

export default RiskAlertPanel;
