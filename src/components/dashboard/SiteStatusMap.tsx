import React, { useState } from "react";
import {
	Layers,
	ZoomIn,
	ZoomOut,
	Maximize2,
	Filter,
	AlertTriangle,
	CheckCircle2,
	Cloud,
	Users,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type DashboardScope = "national" | "state" | "site";

interface RegionSummary {
	name: string;
	status: string;
	sites: number;
	alerts: number;
}

const regionDataByScope: Record<DashboardScope, RegionSummary[]> = {
	national: [
		{ name: "Northern Zone", status: "Critical", sites: 124, alerts: 3 },
		{ name: "Eastern Circuit", status: "Stable", sites: 89, alerts: 0 },
		{ name: "Western Ghats", status: "Attention", sites: 201, alerts: 1 },
		{ name: "Southern Heritage", status: "Stable", sites: 156, alerts: 0 },
		{ name: "Central Monuments", status: "Stable", sites: 98, alerts: 0 },
	],
	state: [
		{ name: "Capital District", status: "Attention", sites: 36, alerts: 1 },
		{ name: "River Plains", status: "Stable", sites: 52, alerts: 0 },
		{ name: "Coastal Belt", status: "Critical", sites: 28, alerts: 2 },
		{ name: "Highland Corridor", status: "Stable", sites: 44, alerts: 0 },
		{ name: "Heritage Core", status: "Attention", sites: 31, alerts: 1 },
	],
	site: [
		{ name: "North Gate", status: "Stable", sites: 4, alerts: 0 },
		{ name: "Temple Complex", status: "Attention", sites: 6, alerts: 1 },
		{ name: "Museum Wing", status: "Stable", sites: 3, alerts: 0 },
		{ name: "Perimeter Path", status: "Critical", sites: 5, alerts: 2 },
		{ name: "Visitor Plaza", status: "Stable", sites: 2, alerts: 0 },
	],
};

const SiteStatusMap: React.FC<{ scope: DashboardScope }> = ({ scope }) => {
	const [activeLayer, setActiveLayer] = useState<"status" | "weather" | "crowd">("status");
	const regions = regionDataByScope[scope];
	const scopeLabel = scope === "national" ? "National" : scope === "state" ? "State" : "Site";
	const summaryLabel =
		scope === "national"
			? "Regional Summary"
			: scope === "state"
				? "State Summary"
				: "Site Summary";
	const unitLabel = scope === "site" ? "Zones" : "Sites";

	return (
		<div className="bg-white border border-stone-200 rounded-lg shadow-sm h-125 flex flex-col overflow-hidden relative">
			{/* Header Toolbar */}
			<div className="p-3 border-b border-stone-200 flex justify-between items-center bg-white z-10">
				<div className="flex items-center gap-4">
					<h3 className="font-serif text-stone-900 font-medium pl-2">
						{scopeLabel} Site Grid
					</h3>
					<div className="h-4 w-px bg-stone-300"></div>
					<div className="flex gap-1 bg-stone-100 p-0.5 rounded-md">
						<button
							onClick={() => setActiveLayer("status")}
							className={cn(
								"px-3 py-1 text-xs font-medium rounded-sm transition-all flex items-center gap-2",
								activeLayer === "status"
									? "bg-white shadow-sm text-stone-900"
									: "text-stone-500 hover:text-stone-800",
							)}>
							<div
								className={cn(
									"w-2 h-2 rounded-full",
									activeLayer === "status"
										? "bg-emerald-500"
										: "bg-stone-400",
								)}
							/>
							Status
						</button>
						<button
							onClick={() => setActiveLayer("weather")}
							className={cn(
								"px-3 py-1 text-xs font-medium rounded-sm transition-all flex items-center gap-2",
								activeLayer === "weather"
									? "bg-white shadow-sm text-stone-900"
									: "text-stone-500 hover:text-stone-800",
							)}>
							<Cloud className="w-3 h-3" />
							Weather
						</button>
						<button
							onClick={() => setActiveLayer("crowd")}
							className={cn(
								"px-3 py-1 text-xs font-medium rounded-sm transition-all flex items-center gap-2",
								activeLayer === "crowd"
									? "bg-white shadow-sm text-stone-900"
									: "text-stone-500 hover:text-stone-800",
							)}>
							<Users className="w-3 h-3" />
							Crowd Density
						</button>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						className="p-1.5 text-stone-500 hover:bg-stone-100 rounded border border-transparent hover:border-stone-200"
						title="Filter View">
						<Filter className="w-4 h-4" />
					</button>
					<button
						className="p-1.5 text-stone-500 hover:bg-stone-100 rounded border border-transparent hover:border-stone-200"
						title="Layers">
						<Layers className="w-4 h-4" />
					</button>
					<div className="h-4 w-px bg-stone-300 mx-1"></div>
					<button
						className="p-1.5 text-stone-500 hover:bg-stone-100 rounded border border-transparent hover:border-stone-200"
						title="Expand">
						<Maximize2 className="w-4 h-4" />
					</button>
				</div>
			</div>

			<div className="flex-1 relative bg-stone-50 overflow-hidden group">
				{/* Abstract Map Grid Background */}
				<div
					className="absolute inset-0"
					style={{
						backgroundImage:
							"linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)",
						backgroundSize: "40px 40px",
					}}></div>

				{/* Floating Region Panel */}
				<div className="absolute top-4 left-4 w-64 bg-white/95 backdrop-blur-sm border border-stone-200 shadow-lg rounded-md overflow-hidden z-20">
					<div className="p-3 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
						<span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
							{summaryLabel}
						</span>
						<span className="text-[10px] text-stone-400">Live Updates</span>
					</div>
					<div className="divide-y divide-stone-100 max-h-75 overflow-y-auto">
						{regions.map((region, i) => (
							<div
								key={i}
								className="p-3 flex justify-between items-center hover:bg-stone-50 cursor-pointer group/item transition-colors">
								<div>
									<div className="text-sm font-medium text-stone-800 group-hover/item:text-blue-900 transition-colors">
										{region.name}
									</div>
									<div className="text-xs text-stone-500">
										{region.sites} {unitLabel} Monitored
									</div>
								</div>
								{region.alerts > 0 ? (
									<div className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-100 animate-pulse">
										<AlertTriangle className="w-3 h-3" />{" "}
										{region.alerts}
									</div>
								) : (
									<div className="text-emerald-600 opacity-50 group-hover/item:opacity-100">
										<CheckCircle2 className="w-4 h-4" />
									</div>
								)}
							</div>
						))}
					</div>
					<div className="p-2 bg-stone-50 border-t border-stone-100 text-center">
						<button className="text-xs text-stone-500 font-medium hover:text-stone-900">
							Download Regional Report
						</button>
					</div>
				</div>

				{/* Map Elements (Abstract Schematic) */}
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-700 ease-out transform group-hover:scale-105">
					{/* Fake Map SVG with more techy look */}
					<svg
						width="600"
						height="400"
						viewBox="0 0 600 400"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="drop-shadow-xl">
						{/* Connecting Lines */}
						<path
							d="M200 150 L350 120 L450 180"
							stroke="#d6d3d1"
							strokeWidth="1"
							strokeDasharray="4 4"
						/>
						<path
							d="M200 150 L200 320 L350 350"
							stroke="#d6d3d1"
							strokeWidth="1"
							strokeDasharray="4 4"
						/>

						{/* Regions */}
						<path
							d="M150 250 L200 150 L350 120 L450 180 L480 280 L350 350 L200 320 Z"
							fill="#e7e5e4"
							stroke="#a8a29e"
							strokeWidth="1.5"
							className="hover:fill-stone-200 transition-colors cursor-pointer pointer-events-auto"
						/>

						{/* Nodes */}
						{/* Critical */}
						<g
							className="pointer-events-auto cursor-pointer group/pin"
							transform="translate(200, 150)">
							<title>Northern Zone Alert</title>
							<circle
								r="6"
								fill="#fca5a5"
								className="animate-ping opacity-75"
							/>
							<circle r="4" fill="#ef4444" stroke="white" strokeWidth="1.5" />
						</g>

						{/* Stable */}
						<g transform="translate(350, 120)">
							<circle r="3" fill="#10b981" />
						</g>
						<g transform="translate(450, 180)">
							<circle r="3" fill="#fbbf24" stroke="white" strokeWidth="1" />
						</g>
						<g transform="translate(480, 280)">
							<circle r="3" fill="#10b981" />
						</g>
						<g transform="translate(350, 350)">
							<circle r="3" fill="#10b981" />
						</g>
						<g transform="translate(200, 320)">
							<circle r="3" fill="#10b981" />
						</g>
					</svg>
				</div>

				{/* Legend / Status Overlay Bottom Left */}
				<div className="absolute bottom-4 left-4 flex gap-4 text-xs bg-white/80 backdrop-blur px-3 py-2 rounded-full border border-stone-200 shadow-sm">
					<div className="flex items-center gap-1.5">
						<span className="w-2 h-2 rounded-full bg-emerald-500"></span>
						<span className="text-stone-600 font-medium">Stable</span>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="w-2 h-2 rounded-full bg-amber-400"></span>
						<span className="text-stone-600 font-medium">Maintenance</span>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="w-2 h-2 rounded-full bg-red-500"></span>
						<span className="text-stone-600 font-medium">Critical</span>
					</div>
				</div>

				{/* Zoom Controls */}
				<div className="absolute bottom-4 right-4 flex flex-col gap-px bg-white border border-stone-200 rounded-md shadow-sm overflow-hidden">
					<button className="p-2 hover:bg-stone-50 text-stone-600 active:bg-stone-100">
						<ZoomIn className="w-4 h-4" />
					</button>
					<div className="h-px w-full bg-stone-100"></div>
					<button className="p-2 hover:bg-stone-50 text-stone-600 active:bg-stone-100">
						<ZoomOut className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);
};

export default SiteStatusMap;
