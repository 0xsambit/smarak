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

const data = [
	{ day: "1", visitors: 4000 },
	{ day: "5", visitors: 3000 },
	{ day: "10", visitors: 2000 },
	{ day: "15", visitors: 2780 },
	{ day: "20", visitors: 1890 },
	{ day: "25", visitors: 2390 },
	{ day: "30", visitors: 3490 },
];

const FootfallSnapshot: React.FC = () => {
	return (
		<div className="bg-white border border-stone-200 rounded-lg shadow-sm h-full flex flex-col">
			<div className="p-4 border-b border-stone-100 bg-stone-50/50">
				<h3 className="font-serif text-stone-900 font-medium">
					Visitor Trends (Last 30 Days)
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
