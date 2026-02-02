import React from "react";
import { Bell, Map, Calendar, ChevronDown } from "lucide-react";

const DashboardHeader: React.FC = () => {
	return (
		<header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
			<div className="flex items-center gap-4">
				<div className="bg-stone-900 text-white p-2 rounded-sm shadow-sm">
					<Map className="w-5 h-5" />
				</div>
				<div>
					<h1 className="text-xl font-serif text-stone-900 font-semibold tracking-tight">
						HeritageGuard
					</h1>
					<p className="text-xs text-stone-500 uppercase tracking-widest font-medium">
						National Department of Archaeology
					</p>
				</div>
			</div>

			<div className="flex items-center gap-4">
				{/* Scope Selector */}
				<div className="hidden md:flex items-center text-sm border border-stone-200 rounded-md bg-stone-50 overflow-hidden">
					<button className="px-4 py-1.5 bg-white shadow-sm font-medium text-stone-900 border-r border-stone-200">
						National
					</button>
					<button className="px-4 py-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors">
						State
					</button>
					<button className="px-4 py-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors">
						Site Level
					</button>
				</div>

				<div className="h-6 w-px bg-stone-200 mx-2 hidden md:block" />

				{/* Date Selector */}
				<button className="flex items-center gap-2 text-sm font-medium text-stone-600 bg-white border border-stone-200 px-3 py-1.5 rounded-md hover:bg-stone-50 transition-colors shadow-sm">
					<Calendar className="w-4 h-4 text-stone-400" />
					<span>Oct 14, 2023 - Nov 14, 2023</span>
					<ChevronDown className="w-3 h-3 text-stone-400" />
				</button>

				{/* Alerts */}
				<button className="relative p-2 text-stone-500 hover:bg-stone-100 rounded-full transition-colors">
					<Bell className="w-5 h-5" />
					<span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border border-white"></span>
				</button>

				<div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-medium text-xs border border-stone-300">
					JD
				</div>
			</div>
		</header>
	);
};

export default DashboardHeader;
