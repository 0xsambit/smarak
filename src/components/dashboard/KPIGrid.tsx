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

const KPIGrid: React.FC = () => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
			<KPICard title="Total Heritage Sites" value="3,842" icon={Landmark} />
			<KPICard
				title="Under Conservation"
				value="142"
				trend="+12% vs last month"
				icon={Hammer}
			/>
			<KPICard
				title="High Risk Sites"
				value="24"
				trend="Requires immediate review"
				trendUp={false}
				icon={AlertOctagon}
				alert
			/>
			<KPICard
				title="Incidents (30d)"
				value="08"
				trend="-4 from last month"
				trendUp={true}
				icon={AlertTriangle}
			/>
			<KPICard
				title="Visitor Footfall"
				value="1.2M"
				trend="+8.5% season"
				trendUp={true}
				icon={Users}
			/>
			<KPICard title="Pending Approvals" value="17" icon={FileText} />
		</div>
	);
};

export default KPIGrid;
