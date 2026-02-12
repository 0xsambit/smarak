import React from "react";
import { Landmark, Hammer, AlertTriangle, AlertOctagon, Users, FileText } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

interface KPICardProps {
	title: string;
	value: string | number;
	trend?: string;
	trendUp?: boolean; // true for good, false for bad/neutral
	icon: React.ElementType;
	alert?: boolean;
}

type DashboardScope = "national" | "state" | "site";

const KPICard: React.FC<KPICardProps> = ({ title, value, trend, trendUp, icon: Icon, alert }) => {
	return (
		<div
			className={cn(
				"p-5 rounded-lg border bg-white shadow-sm flex flex-col justify-between h-32 transition-all hover:shadow-md",
				alert ? "border-red-200 bg-red-50/30" : "border-stone-200",
			)}>
			<div className="flex justify-between items-start">
				<span className="text-stone-500 text-xs font-semibold uppercase tracking-wider">
					{title}
				</span>
				<Icon className={cn("w-5 h-5", alert ? "text-red-500" : "text-stone-400")} />
			</div>
			<div>
				<div className="text-2xl font-serif text-stone-900 font-medium">{value}</div>
				{trend && (
					<div
						className={cn(
							"text-xs mt-1 font-medium",
							trendUp ? "text-emerald-600" : "text-amber-600",
						)}>
						{trend}
					</div>
				)}
			</div>
		</div>
	);
};

interface KPIGridProps {
	scope: DashboardScope;
	kpis?: {
		totalSites: number;
		highRiskSites: number;
		activeIncidents: number;
		pendingApprovals: number;
		conservationOngoing: number;
		visitorCapacity: number;
	};
}

const KPI_DATA: Record<DashboardScope, KPICardProps[]> = {
	national: [
		{ title: "Total Heritage Sites", value: "3,842", icon: Landmark },
		{
			title: "Under Conservation",
			value: "142",
			trend: "+12% vs last month",
			icon: Hammer,
		},
		{
			title: "High Risk Sites",
			value: "24",
			trend: "Requires immediate review",
			trendUp: false,
			icon: AlertOctagon,
			alert: true,
		},
		{
			title: "Incidents (30d)",
			value: "08",
			trend: "-4 from last month",
			trendUp: true,
			icon: AlertTriangle,
		},
		{
			title: "Visitor Footfall",
			value: "1.2M",
			trend: "+8.5% season",
			trendUp: true,
			icon: Users,
		},
		{ title: "Pending Approvals", value: "17", icon: FileText },
	],
	state: [
		{ title: "Total Heritage Sites", value: "412", icon: Landmark },
		{
			title: "Under Conservation",
			value: "28",
			trend: "+5% vs last month",
			icon: Hammer,
		},
		{
			title: "High Risk Sites",
			value: "6",
			trend: "Focused inspections",
			trendUp: false,
			icon: AlertOctagon,
			alert: true,
		},
		{
			title: "Incidents (30d)",
			value: "03",
			trend: "-1 from last month",
			trendUp: true,
			icon: AlertTriangle,
		},
		{
			title: "Visitor Footfall",
			value: "220k",
			trend: "+4.2% season",
			trendUp: true,
			icon: Users,
		},
		{ title: "Pending Approvals", value: "5", icon: FileText },
	],
	site: [
		{ title: "Zones Monitored", value: "18", icon: Landmark },
		{
			title: "Active Work Orders",
			value: "4",
			trend: "+1 this week",
			icon: Hammer,
		},
		{
			title: "High Risk Zones",
			value: "2",
			trend: "Perimeter watch",
			trendUp: false,
			icon: AlertOctagon,
			alert: true,
		},
		{
			title: "Incidents (30d)",
			value: "01",
			trend: "Stable",
			trendUp: true,
			icon: AlertTriangle,
		},
		{
			title: "Visitor Footfall",
			value: "18.4k",
			trend: "+2.1% season",
			trendUp: true,
			icon: Users,
		},
		{ title: "Pending Approvals", value: "2", icon: FileText },
	],
};

const KPIGrid: React.FC<KPIGridProps> = ({ scope, kpis: apiKpis }) => {
	// Use API data if available, otherwise fall back to mock data
	const kpis = apiKpis
		? [
				{ title: "Total Heritage Sites", value: apiKpis.totalSites, icon: Landmark },
				{
					title: "Under Conservation",
					value: apiKpis.conservationOngoing,
					icon: Hammer,
				},
				{
					title: "High Risk Sites",
					value: apiKpis.highRiskSites,
					trendUp: false,
					icon: AlertOctagon,
					alert: apiKpis.highRiskSites > 0,
				},
				{
					title: "Active Incidents",
					value: apiKpis.activeIncidents,
					icon: AlertTriangle,
				},
				{
					title: "Visitor Capacity",
					value: apiKpis.visitorCapacity.toLocaleString(),
					icon: Users,
				},
				{ title: "Pending Approvals", value: apiKpis.pendingApprovals, icon: FileText },
			]
		: KPI_DATA[scope];

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
			{kpis.map((kpi) => (
				<KPICard key={kpi.title} {...kpi} />
			))}
		</div>
	);
};

export default KPIGrid;
