import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { DashboardScope, RegionSummary } from '../../types/dashboard';

type StatusFilter = 'all' | 'issues' | 'critical';

const filterLabel: Record<StatusFilter, string> = {
  all: 'All Regions',
  issues: 'Issues Only',
  critical: 'Critical Only',
};

const statusColor: Record<string, string> = {
  Stable: '#10b981',
  Attention: '#f59e0b',
  Critical: '#ef4444',
};

const nodePositions = [
  { x: 190, y: 130 },
  { x: 325, y: 105 },
  { x: 430, y: 170 },
  { x: 455, y: 285 },
  { x: 330, y: 330 },
  { x: 205, y: 300 },
  { x: 150, y: 210 },
  { x: 280, y: 210 },
  { x: 390, y: 240 },
  { x: 260, y: 155 },
];

interface SiteStatusMapProps {
  scope: DashboardScope;
  regionSummary: RegionSummary[];
}

const SiteStatusMap: React.FC<SiteStatusMapProps> = ({ scope, regionSummary }) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const filteredRegions = useMemo(() => {
    if (statusFilter === 'critical') {
      return regionSummary.filter((region) => region.status === 'Critical');
    }

    if (statusFilter === 'issues') {
      return regionSummary.filter((region) => region.status !== 'Stable');
    }

    return regionSummary;
  }, [regionSummary, statusFilter]);

  const activeRegion = filteredRegions.find((region) => region.name === selectedRegion) || filteredRegions[0] || null;
  const scopeLabel = scope === 'national' ? 'National' : scope === 'state' ? 'State' : 'Site';
  const summaryLabel = scope === 'site' ? 'Zones' : 'Sites';

  const cycleFilter = () => {
    setStatusFilter((current) => {
      if (current === 'all') {
        return 'issues';
      }
      if (current === 'issues') {
        return 'critical';
      }
      return 'all';
    });
  };

  const downloadCsv = () => {
    if (filteredRegions.length === 0) {
      return;
    }

    const rows = ['name,status,sites,alerts', ...filteredRegions.map((region) => `${region.name},${region.status},${region.sites},${region.alerts}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scope}-region-summary.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const containerClass = expanded
    ? 'fixed inset-6 z-40 flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-2xl'
    : 'flex h-[32rem] flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm';

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between border-b border-stone-200 bg-white p-3">
        <div>
          <h3 className="font-serif font-medium text-stone-900">{scopeLabel} Site Grid</h3>
          <p className="mt-1 text-xs text-stone-500">{filterLabel[statusFilter]} from live site and incident data</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cycleFilter}
            className="rounded border border-stone-200 p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            title="Cycle status filter"
          >
            <Filter className="h-4 w-4" />
          </button>
          <button
            onClick={downloadCsv}
            className="rounded border border-stone-200 p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            title="Download regional summary"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setExpanded((value) => !value)}
            className="rounded border border-stone-200 p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            title={expanded ? 'Collapse map' : 'Expand map'}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 overflow-hidden bg-stone-50">
        <div className="z-10 w-72 border-r border-stone-100 bg-white/95 backdrop-blur-sm">
          <div className="border-b border-stone-100 bg-stone-50 p-3 text-[11px] font-bold uppercase tracking-wider text-stone-500">
            {scopeLabel} Summary
          </div>
          <div className="max-h-full divide-y divide-stone-100 overflow-y-auto">
            {filteredRegions.length === 0 ? (
              <div className="p-4 text-sm text-stone-500">No regions match the current filter.</div>
            ) : (
              filteredRegions.map((region) => (
                <button
                  key={region.name}
                  onClick={() => setSelectedRegion(region.name)}
                  className={`flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-stone-50 ${
                    activeRegion?.name === region.name ? 'bg-stone-50' : ''
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-stone-800">{region.name}</div>
                    <div className="text-xs text-stone-500">{region.sites} {summaryLabel} monitored</div>
                  </div>
                  {region.alerts > 0 ? (
                    <div className="inline-flex items-center gap-1 rounded border border-red-100 bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
                      <AlertTriangle className="h-3 w-3" />
                      {region.alerts}
                    </div>
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(#e7e5e4 1px, transparent 1px), linear-gradient(90deg, #e7e5e4 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center transition-transform duration-300" style={{ transform: `scale(${zoom})` }}>
            <svg width="620" height="420" viewBox="0 0 620 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
              <path d="M145 255 L190 130 L325 105 L430 170 L455 285 L330 330 L205 300 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
              <path d="M190 130 L325 105 L430 170" stroke="#d6d3d1" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M190 130 L205 300 L330 330" stroke="#d6d3d1" strokeWidth="1" strokeDasharray="4 4" />
              {filteredRegions.map((region, index) => {
                const position = nodePositions[index % nodePositions.length];
                const fill = statusColor[region.status] || '#44403c';
                const isActive = activeRegion?.name === region.name;

                return (
                  <g key={region.name} transform={`translate(${position.x}, ${position.y})`}>
                    {region.status === 'Critical' ? <circle r="9" fill={fill} opacity="0.22" /> : null}
                    <circle r={isActive ? 7 : 5} fill={fill} stroke="white" strokeWidth="2" />
                  </g>
                );
              })}
            </svg>
          </div>

          {activeRegion ? (
            <div className="absolute bottom-4 left-4 rounded-xl border border-stone-200 bg-white/90 p-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Focused Region</p>
              <h4 className="mt-2 text-base font-semibold text-stone-900">{activeRegion.name}</h4>
              <div className="mt-3 grid gap-3 text-sm text-stone-600 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400">Status</p>
                  <p className="font-medium text-stone-900">{activeRegion.status}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400">{summaryLabel}</p>
                  <p className="font-medium text-stone-900">{activeRegion.sites}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400">Open Alerts</p>
                  <p className="font-medium text-stone-900">{activeRegion.alerts}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="absolute bottom-4 right-4 flex flex-col gap-px overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm">
            <button
              onClick={() => setZoom((value) => Math.min(value + 0.1, 1.6))}
              className="p-2 text-stone-600 hover:bg-stone-50"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="h-px w-full bg-stone-100"></div>
            <button
              onClick={() => setZoom((value) => Math.max(value - 0.1, 0.8))}
              className="p-2 text-stone-600 hover:bg-stone-50"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteStatusMap;
