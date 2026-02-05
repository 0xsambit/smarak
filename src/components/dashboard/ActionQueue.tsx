import React from "react";
import { Eye, CheckCircle } from "lucide-react";

type DashboardScope = "national" | "state" | "site";

interface ApprovalItem {
	id: string;
	type: string;
	site: string;
	submittedBy: string;
	date: string;
	priority: "High" | "Normal";
}

const queueByScope: Record<DashboardScope, ApprovalItem[]> = {
	national: [
		{
			id: "REQ-2023-001",
			type: "Budget Allocation",
			site: "Qutub Minar Complex",
			submittedBy: "R. Sharma (Site Manager)",
			date: "Oct 12, 2023",
			priority: "High",
		},
		{
			id: "REQ-2023-002",
			type: "Restoration Vendor",
			site: "Sanchi Stupa",
			submittedBy: "A. Patel (Conservationist)",
			date: "Oct 13, 2023",
			priority: "Normal",
		},
		{
			id: "REQ-2023-003",
			type: "Public Event Permit",
			site: "Golconda Fort",
			submittedBy: "Tourism Dept.",
			date: "Oct 14, 2023",
			priority: "Normal",
		},
	],
	state: [
		{
			id: "REQ-STATE-104",
			type: "Conservation Budget",
			site: "Heritage Museum",
			submittedBy: "State Heritage Office",
			date: "Nov 02, 2023",
			priority: "High",
		},
		{
			id: "REQ-STATE-105",
			type: "Maintenance Contract",
			site: "Capital Heritage Park",
			submittedBy: "Facilities Unit",
			date: "Nov 03, 2023",
			priority: "Normal",
		},
		{
			id: "REQ-STATE-106",
			type: "Event Permit",
			site: "Riverfront Fort",
			submittedBy: "Tourism Desk",
			date: "Nov 04, 2023",
			priority: "Normal",
		},
	],
	site: [
		{
			id: "REQ-SITE-011",
			type: "Zone Access Approval",
			site: "Temple Complex",
			submittedBy: "Site Ops Lead",
			date: "Nov 05, 2023",
			priority: "High",
		},
		{
			id: "REQ-SITE-012",
			type: "Equipment Request",
			site: "Museum Wing",
			submittedBy: "Security Team",
			date: "Nov 06, 2023",
			priority: "Normal",
		},
	],
};

const ActionQueue: React.FC<{ scope: DashboardScope }> = ({ scope }) => {
	const queue = queueByScope[scope];
	const locationLabel = scope === "site" ? "Zone" : "Site";
	return (
		<div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
			<div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
				<h3 className="font-serif text-stone-900 font-medium heading-font">
					Pending Approvals & Actions
				</h3>
				<span className="text-xs text-stone-500 font-medium">
					{queue.length} Pending
				</span>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full text-sm text-left">
					<thead className="bg-stone-50 text-stone-500 uppercase text-xs font-semibold tracking-wider">
						<tr>
							<th className="px-6 py-3 font-medium">Request Type</th>
							<th className="px-6 py-3 font-medium">{locationLabel}</th>
							<th className="px-6 py-3 font-medium">Submitted By</th>
							<th className="px-6 py-3 font-medium">Date</th>
							<th className="px-6 py-3 font-medium">Priority</th>
							<th className="px-6 py-3 font-medium text-right">Action</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-stone-100">
						{queue.map((item) => (
							<tr
								key={item.id}
								className="hover:bg-stone-50/50 transition-colors group">
								<td className="px-6 py-4 font-medium text-stone-900">
									{item.type}
								</td>
								<td className="px-6 py-4 text-stone-600">{item.site}</td>
								<td className="px-6 py-4 text-stone-500">
									{item.submittedBy}
								</td>
								<td className="px-6 py-4 text-stone-500">{item.date}</td>
								<td className="px-6 py-4">
									<span
										className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
											item.priority === "High"
												? "bg-red-50 text-red-700"
												: "bg-emerald-50 text-emerald-700"
										}`}>
										{item.priority}
									</span>
								</td>
								<td className="px-6 py-4 text-right">
									<div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
										<button className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200 rounded">
											<Eye className="w-4 h-4" />
										</button>
										<button className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded">
											<CheckCircle className="w-4 h-4" />
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default ActionQueue;
