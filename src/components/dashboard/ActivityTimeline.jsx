import { CheckCircle2, FileCheck, Hammer } from 'lucide-react';

const iconMap = {
  incident: Hammer,
  conservation: CheckCircle2,
  approval: FileCheck,
  default: FileCheck,
};

const ActivityTimeline = ({ scope, recentActivity }) => {
  const scopeLabel = scope === 'national' ? 'National' : scope === 'state' ? 'State' : 'Site';

  return (
    <div className="flex h-full flex-col rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-100 bg-stone-50/50 p-4">
        <h3 className="font-serif font-medium text-stone-900">Recent Activity</h3>
        <p className="mt-1 text-xs text-stone-500">{scopeLabel} updates from the live system</p>
      </div>
      <div className="flex-1 p-4">
        {recentActivity.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-stone-200 bg-stone-50 px-4 text-center text-sm text-stone-500">
            No activity has been recorded for this scope yet.
          </div>
        ) : (
          <div className="relative space-y-6">
            <div className="absolute bottom-2 left-3.5 top-2 w-px bg-stone-200"></div>
            {recentActivity.map((activity) => {
              const ActivityIcon = iconMap[activity.type] || iconMap.default;
              return (
                <div key={activity.id} className="relative pl-10">
                  <div className="absolute left-0 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm">
                    <ActivityIcon className="h-3.5 w-3.5 text-stone-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">{activity.text}</p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      <span className="font-medium text-stone-700">{activity.site}</span> by {activity.user}
                    </p>
                    <span className="mt-1 block text-[10px] text-stone-400">{activity.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
