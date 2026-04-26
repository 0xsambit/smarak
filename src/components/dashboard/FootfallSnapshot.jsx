import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const FootfallSnapshot = ({ scope, footfallTrend }) => {
  const scopeLabel = scope === 'national' ? 'National' : scope === 'state' ? 'State' : 'Site';

  return (
    <div className="flex h-full flex-col rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-100 bg-stone-50/50 p-4">
        <h3 className="font-serif font-medium text-stone-900">{scopeLabel} Visitor Trends (Last 7 Days)</h3>
      </div>
      <div className="min-h-50 flex-1 p-4">
        {footfallTrend.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-stone-200 bg-stone-50 px-4 text-center text-sm text-stone-500">
            Visitor trend data will appear here once footfall records exist for this scope.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={footfallTrend}>
              <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#78716c', fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { weekday: 'short' })}
                tickMargin={10}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  border: '1px solid #e7e5e4',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
                formatter={(value) => [Number(value || 0).toLocaleString(), 'Visitors']}
                labelFormatter={(value) =>
                  new Date(String(value)).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                }
              />
              <Line
                type="monotone"
                dataKey="visitors"
                stroke="#44403c"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#1c1917' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default FootfallSnapshot;
