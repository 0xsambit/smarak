import React from "react";
import { FileCheck, Hammer, CheckCircle2 } from "lucide-react";

type DashboardScope = "national" | "state" | "site";

interface ActivityItem {
	id: number;
	text: string;
	site: string;
	time: string;
	user: string;
	icon: React.ElementType;
}

const activitiesByScope: Record<DashboardScope, ActivityItem[]> = {
	national: [
		{
			id: 1,
			text: "Inspection report submitted",
			site: "Ellora Caves",
			time: "2 hours ago",
			user: "Officer R. Singh",
			icon: FileCheck,
		},
		{
			id: 2,
			text: "Restoration marked completed",
			site: "Taj Mahal - Minaret 3",
			time: "5 hours ago",
			user: "Conservation Team A",
			icon: CheckCircle2,
		},
		{
			id: 3,
			text: "Incident resolved",
			site: "Red Fort",
			time: "1 day ago",
			user: "Security Head",
			icon: Hammer,
		},
		{
			id: 4,
			text: "New site added to registry",
			site: "Dholavira Excavations",
			time: "2 days ago",
			user: "Admin",
			icon: FileCheck,
		},
	],
	state: [
		{
			id: 1,
			text: "District audit completed",
			site: "Capital Heritage Park",
			time: "3 hours ago",
			user: "State Audit Team",
			icon: FileCheck,
		},
		{
			id: 2,
			text: "Restoration batch approved",
			site: "Riverfront Fort",
			time: "6 hours ago",
			user: "Conservation Board",
			icon: CheckCircle2,
		},
		{
			id: 3,
			text: "Incident triaged",
			site: "Hilltop Temple",
			time: "1 day ago",
			user: "Safety Office",
			icon: Hammer,
		},
	],
	site: [
		{
			id: 1,
			text: "Daily inspection logged",
			site: "North Gate",
			time: "1 hour ago",
			user: "Shift Supervisor",
			icon: FileCheck,
		},
		{
			id: 2,
			text: "Maintenance completed",
			site: "Museum Wing",
			time: "4 hours ago",
			user: "Facilities Team",
			icon: CheckCircle2,
		},
		{
			id: 3,
			text: "Incident resolved",
			site: "Perimeter Path",
			time: "1 day ago",
			user: "Security Desk",
			icon: Hammer,
		},
	],
};

interface ActivityTimelineProps {
	scope: DashboardScope;
	recentActivity?: Array<{
		id: string;
		type: string;
		text: string;
		site: string;
		time: string;
		user: string;
	}>;
}

// Map activity types to icons
const iconMap: Record<string, React.ElementType> = {
	incident: Hammer,
	conservation: CheckCircle2,
	approval: FileCheck,
	default: FileCheck,
};

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ scope, recentActivity }) => {
	const mockActivities = activitiesByScope[scope];

	// Convert API activity to display format
	const activities =
		recentActivity && recentActivity.length > 0
			? recentActivity.map((act, index) => ({
					id: parseInt(act.id) || index,
					text: act.text,
					site: act.site,
					time: act.time,
					user: act.user,
					icon: iconMap[act.type] || iconMap.default,
				}))
			: mockActivities;
	return (
		<div className="bg-white border border-stone-200 rounded-lg shadow-sm h-full flex flex-col">
			<div className="p-4 border-b border-stone-100 bg-stone-50/50">
				<h3 className="font-serif text-stone-900 font-medium">Recent Activity</h3>
			</div>
			<div className="p-4 flex-1">
				<div className="space-y-6 relative">
					{/* Vertical Line */}
					<div className="absolute left-3.5 top-2 bottom-2 w-px bg-stone-200"></div>

					{activities.map((act) => (
						<div key={act.id} className="relative pl-10">
							<div className="absolute left-0 top-1 w-8 h-8 bg-white border border-stone-200 rounded-full flex items-center justify-center z-10 shadow-sm">
								<act.icon className="w-3.5 h-3.5 text-stone-500" />
							</div>
							<div>
								<p className="text-sm font-medium text-stone-800">
									{act.text}
								</p>
								<p className="text-xs text-stone-500 mt-0.5">
									<span className="font-medium text-stone-700">
										{act.site}
									</span>{" "}
									• {act.user}
								</p>
								<span className="text-[10px] text-stone-400 mt-1 block">
									{act.time}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
			<div className="p-3 border-t border-stone-100 text-center">
				<button className="text-xs font-medium text-stone-500 hover:text-stone-900">
					View Audit Log
				</button>
			</div>
		</div>
	);
};

export default ActivityTimeline;
