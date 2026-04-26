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
  detail: string;
  icon: React.ElementType;
  accent: string;
  textAccent: string;
  ringAccent: string;
}

interface KPIGridProps {
  scope: DashboardScope;
  kpis: DashboardKpis;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  detail,
  icon: Icon,
  accent,
  textAccent,
  ringAccent,
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[24px] border bg-white/90 p-5 shadow-[0_18px_45px_rgba(120,113,108,0.12)] transition-transform hover:-translate-y-0.5',
        ringAccent,
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-1.5', accent)} />
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">{title}</span>
        <div className={cn('rounded-2xl p-3', accent)}>
          <Icon className={cn('h-5 w-5', textAccent)} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-semibold tracking-tight text-stone-950">{value}</div>
        <div className="mt-2 text-sm text-stone-600">{detail}</div>
      </div>
    </div>
  );
};

const KPIGrid: React.FC<KPIGridProps> = ({ kpis }) => {
  const cards: KPICardProps[] = [
    {
      title: 'Total Heritage Sites',
      value: kpis.totalSites,
      icon: Landmark,
      detail: 'Visible in the current operating scope',
      accent: 'bg-stone-100',
      textAccent: 'text-stone-800',
      ringAccent: 'border-stone-200',
    },
    {
      title: 'Conservation Projects',
      value: kpis.conservationOngoing,
      icon: Hammer,
      detail: 'All conservation records in scope',
      accent: 'bg-emerald-100',
      textAccent: 'text-emerald-700',
      ringAccent: 'border-emerald-200',
    },
    {
      title: 'High Risk Sites',
      value: kpis.highRiskSites,
      icon: AlertOctagon,
      detail: kpis.highRiskSites > 0 ? 'Requires immediate review' : 'No critical sites in scope',
      accent: 'bg-red-100',
      textAccent: 'text-red-700',
      ringAccent: 'border-red-200',
    },
    {
      title: 'Total Incidents',
      value: kpis.activeIncidents,
      icon: AlertTriangle,
      detail: 'All incident records in scope',
      accent: 'bg-amber-100',
      textAccent: 'text-amber-700',
      ringAccent: 'border-amber-200',
    },
    {
      title: 'Visitor Capacity',
      value: kpis.visitorCapacity.toLocaleString(),
      icon: Users,
      detail: 'Combined capacity across monitored sites',
      accent: 'bg-sky-100',
      textAccent: 'text-sky-700',
      ringAccent: 'border-sky-200',
    },
    {
      title: 'Total Approvals',
      value: kpis.pendingApprovals,
      icon: FileText,
      detail: 'All approval records in scope',
      accent: 'bg-violet-100',
      textAccent: 'text-violet-700',
      ringAccent: 'border-violet-200',
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((kpi) => (
        <KPICard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
};

export default KPIGrid;
