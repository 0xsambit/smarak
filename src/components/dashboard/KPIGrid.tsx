import React from 'react';
import { AlertOctagon, AlertTriangle, FileText, Hammer, Landmark, Users } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { DashboardKpis, DashboardScope } from '../../types/dashboard';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon: React.ElementType;
  alert?: boolean;
}

interface KPIGridProps {
  scope: DashboardScope;
  kpis: DashboardKpis;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, trend, trendUp, icon: Icon, alert }) => {
  return (
    <div
      className={cn(
        'flex h-32 flex-col justify-between rounded-lg border bg-white p-5 shadow-sm transition-all hover:shadow-md',
        alert ? 'border-red-200 bg-red-50/30' : 'border-stone-200',
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">{title}</span>
        <Icon className={cn('h-5 w-5', alert ? 'text-red-500' : 'text-stone-400')} />
      </div>
      <div>
        <div className="text-2xl font-medium text-stone-900">{value}</div>
        {trend ? (
          <div className={cn('mt-1 text-xs font-medium', trendUp ? 'text-emerald-600' : 'text-amber-600')}>
            {trend}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const KPIGrid: React.FC<KPIGridProps> = ({ kpis }) => {
  const cards: KPICardProps[] = [
    { title: 'Total Heritage Sites', value: kpis.totalSites, icon: Landmark },
    { title: 'Under Conservation', value: kpis.conservationOngoing, icon: Hammer },
    {
      title: 'High Risk Sites',
      value: kpis.highRiskSites,
      icon: AlertOctagon,
      alert: kpis.highRiskSites > 0,
      trend: kpis.highRiskSites > 0 ? 'Requires immediate review' : 'No critical sites',
      trendUp: false,
    },
    { title: 'Active Incidents', value: kpis.activeIncidents, icon: AlertTriangle },
    { title: 'Visitor Capacity', value: kpis.visitorCapacity.toLocaleString(), icon: Users },
    { title: 'Pending Approvals', value: kpis.pendingApprovals, icon: FileText },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((kpi) => (
        <KPICard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
};

export default KPIGrid;
