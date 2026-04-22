import React from 'react';
import { Bell, Map } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import type { DashboardScope, SiteSummary } from '../../types/dashboard';

interface DashboardHeaderProps {
  scope: DashboardScope;
  title: string;
  subtitle: string;
  dateRangeLabel: string;
  stateOptions: string[];
  selectedState: string;
  siteOptions: SiteSummary[];
  selectedSiteId: string;
  criticalCount: number;
  activeRole?: string;
  onScopeChange: (scope: DashboardScope) => void;
  onStateChange: (state: string) => void;
  onSiteChange: (siteId: string) => void;
  onAlertClick: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  scope,
  title,
  subtitle,
  dateRangeLabel,
  stateOptions,
  selectedState,
  siteOptions,
  selectedSiteId,
  criticalCount,
  activeRole,
  onScopeChange,
  onStateChange,
  onSiteChange,
  onAlertClick,
}) => {
  const renderFilters = () => {
    if (scope === 'national') {
      return null;
    }

    return (
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <select
          value={selectedState}
          onChange={(event) => onStateChange(event.target.value)}
          className="rounded-full border border-stone-200 bg-white/90 px-4 py-2 text-sm text-stone-700 shadow-sm focus:border-stone-400 focus:outline-none"
        >
          {stateOptions.length === 0 ? <option value="">No states available</option> : null}
          {stateOptions.map((stateOption) => (
            <option key={stateOption} value={stateOption}>
              {stateOption}
            </option>
          ))}
        </select>

        {scope === 'site' ? (
          <select
            value={selectedSiteId}
            onChange={(event) => onSiteChange(event.target.value)}
            className="rounded-full border border-stone-200 bg-white/90 px-4 py-2 text-sm text-stone-700 shadow-sm focus:border-stone-400 focus:outline-none"
            disabled={siteOptions.length === 0}
          >
            {siteOptions.length === 0 ? <option value="">No sites available</option> : null}
            {siteOptions.map((site) => (
              <option key={site._id} value={site._id}>
                {site.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-[#f8f5ef]/85 px-4 py-4 backdrop-blur sm:px-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="rounded-[28px] border border-stone-200/80 bg-white/72 p-4 shadow-[0_18px_55px_rgba(120,113,108,0.12)] backdrop-blur xl:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-stone-900 p-3 text-white shadow-sm">
                <Map className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                    Live Dashboard
                  </span>
                  <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                    {activeRole || 'Unknown Role'}
                  </span>
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">
                  {title}
                </h1>
                <p className="mt-2 text-sm text-stone-600">{subtitle}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={scope}
                  onChange={(event) => onScopeChange(event.target.value as DashboardScope)}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 shadow-sm focus:border-stone-400 focus:outline-none md:hidden"
                >
                  <option value="national">National</option>
                  <option value="state">State</option>
                  <option value="site">Site</option>
                </select>

                <div className="hidden rounded-full border border-stone-200 bg-stone-100/80 p-1 md:flex">
                  {(['national', 'state', 'site'] as DashboardScope[]).map((scopeOption) => (
                    <button
                      key={scopeOption}
                      onClick={() => onScopeChange(scopeOption)}
                      className={`rounded-full px-4 py-2 text-sm transition-colors ${
                        scope === scopeOption
                          ? 'bg-stone-950 text-white shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {scopeOption.charAt(0).toUpperCase() + scopeOption.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 shadow-sm">
                  Last 7 Days: {dateRangeLabel}
                </div>

                <button
                  onClick={onAlertClick}
                  className="relative rounded-full border border-stone-200 bg-white p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                  aria-label="Jump to critical alerts"
                >
                  <Bell className="h-5 w-5" />
                  {criticalCount > 0 ? (
                    <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                      {criticalCount}
                    </span>
                  ) : null}
                </button>

                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'h-9 w-9 ring-2 ring-white shadow-sm',
                    },
                  }}
                />
              </div>

              {renderFilters()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
