import React from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
} from "recharts";

type DashboardScope = "national" | "state" | "site";

const dataByScope: Record<DashboardScope, Array<{ day: string; visitors: number }>> = {
	national: [
		{ day: "1", visitors: 4000 },
		{ day: "5", visitors: 3000 },
		{ day: "10", visitors: 2000 },
		{ day: "15", visitors: 2780 },
		{ day: "20", visitors: 1890 },
		{ day: "25", visitors: 2390 },
		{ day: "30", visitors: 3490 },
	],
	state: [
		{ day: "1", visitors: 920 },
		{ day: "5", visitors: 840 },
		{ day: "10", visitors: 780 },
		{ day: "15", visitors: 860 },
		{ day: "20", visitors: 730 },
		{ day: "25", visitors: 810 },
		{ day: "30", visitors: 980 },
	],
	site: [
		{ day: "1", visitors: 120 },
		{ day: "5", visitors: 140 },
		{ day: "10", visitors: 110 },
		{ day: "15", visitors: 160 },
		{ day: "20", visitors: 130 },
		{ day: "25", visitors: 150 },
		{ day: "30", visitors: 170 },
	],
};

interface FootfallSnapshotProps {
	scope: DashboardScope;
	footfallTrend?: Array<{ day: string; visitors: number }>;
}

const FootfallSnapshot: React.FC<FootfallSnapshotProps> = ({ scope, footfallTrend }) => {
	const data = footfallTrend && footfallTrend.length > 0 ? footfallTrend : dataByScope[scope];
	const scopeLabel = scope === "national" ? "National" : scope === "state" ? "State" : "Site";
	return (
		<div className="bg-white border border-stone-200 rounded-lg shadow-sm h-full flex flex-col">
			<div className="p-4 border-b border-stone-100 bg-stone-50/50">
				<h3 className="font-serif text-stone-900 font-medium">
					{scopeLabel} Visitor Trends (Last 30 Days)
				</h3>
			</div>
			<div className="flex-1 w-full p-4 min-h-50">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={data}>
						<CartesianGrid
							strokeDasharray="3 3"
							vertical={false}
							stroke="#E5E5E5"
						/>
						<XAxis
							dataKey="day"
							axisLine={false}
							tickLine={false}
							tick={{ fill: "#78716c", fontSize: 12 }}
							tickMargin={10}
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tick={{ fill: "#78716c", fontSize: 12 }}
						/>
						<Tooltip
							contentStyle={{
								border: "1px solid #e7e5e4",
								borderRadius: "4px",
								boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
							}}
							itemStyle={{
								color: "#1c1917",
								fontSize: "13px",
								fontWeight: 500,
							}}
							labelStyle={{ display: "none" }}
						/>
						<Line
							type="monotone"
							dataKey="visitors"
							stroke="#44403c"
							strokeWidth={2}
							dot={false}
							activeDot={{ r: 4, fill: "#1c1917" }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default FootfallSnapshot;
