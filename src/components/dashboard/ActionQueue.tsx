import React from "react";
import { Eye, CheckCircle } from "lucide-react";

interface ApprovalItem {
	id: string;
	type: string;
	site: string;
	submittedBy: string;
	date: string;
	priority: "High" | "Normal";
}

const queue: ApprovalItem[] = [
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
];

const ActionQueue: React.FC = () => {
	return (
		<div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
			<div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
				<h3 className="font-serif text-stone-900 font-medium heading-font">
					Pending Approvals & Actions
				</h3>
				<span className="text-xs text-stone-500 font-medium">3 Pending</span>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full text-sm text-left">
					<thead className="bg-stone-50 text-stone-500 uppercase text-xs font-semibold tracking-wider">
						<tr>
							<th className="px-6 py-3 font-medium">Request Type</th>
							<th className="px-6 py-3 font-medium">Site</th>
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
