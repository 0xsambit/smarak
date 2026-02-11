import React from "react";
import { Bell, Map, Calendar, ChevronDown } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

type DashboardScope = "national" | "state" | "site";

interface DashboardHeaderProps {
	scope: DashboardScope;
	onScopeChange: (scope: DashboardScope) => void;
}

const scopeSubtitle: Record<DashboardScope, string> = {
	national: "National Department of Archaeology",
	state: "State Heritage Directorate",
	site: "Site Operations Unit",
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ scope, onScopeChange }) => {
	return (
		<header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
			<div className="flex items-center gap-4">
				<div className="bg-stone-900 text-white p-2 rounded-sm shadow-sm">
					<Map className="w-5 h-5" />
				</div>
				<div>
					<h1 className="text-xl font-serif text-stone-900 font-semibold tracking-tight">
						ASI Kolkata Circle
					</h1>
					<p className="text-xs text-stone-500 uppercase tracking-widest font-medium">
						{scopeSubtitle[scope]}
					</p>
				</div>
			</div>

			<div className="flex items-center gap-4">
				{/* Scope Selector */}
				<div className="hidden md:flex items-center text-sm border border-stone-200 rounded-md bg-stone-50 overflow-hidden">
					<button
						onClick={() => onScopeChange("national")}
						className={`px-4 py-1.5 border-r border-stone-200 transition-colors ${
							scope === "national"
								? "bg-white shadow-sm font-medium text-stone-900"
								: "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
						}`}>
						National
					</button>
					<button
						onClick={() => onScopeChange("state")}
						className={`px-4 py-1.5 transition-colors ${
							scope === "state"
								? "bg-white shadow-sm font-medium text-stone-900"
								: "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
						}`}>
						State
					</button>
					<button
						onClick={() => onScopeChange("site")}
						className={`px-4 py-1.5 transition-colors ${
							scope === "site"
								? "bg-white shadow-sm font-medium text-stone-900"
								: "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
						}`}>
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

				{/* User Profile & Logout */}
				<UserButton
					afterSignOutUrl="/"
					appearance={{
						elements: {
							avatarBox: "w-8 h-8",
						},
					}}
				/>
			</div>
		</header>
	);
};

export default DashboardHeader;
