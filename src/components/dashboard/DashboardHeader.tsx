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
          className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm focus:border-stone-400 focus:outline-none"
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
            className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm focus:border-stone-400 focus:outline-none"
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
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-sm bg-stone-900 p-2 text-white shadow-sm">
            <Map className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-stone-900">{title}</h1>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={scope}
              onChange={(event) => onScopeChange(event.target.value as DashboardScope)}
              className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm focus:border-stone-400 focus:outline-none md:hidden"
            >
              <option value="national">National</option>
              <option value="state">State</option>
              <option value="site">Site</option>
            </select>

            <div className="hidden overflow-hidden rounded-md border border-stone-200 bg-stone-50 md:flex">
              <button
                onClick={() => onScopeChange('national')}
                className={`border-r border-stone-200 px-4 py-2 text-sm transition-colors ${
                  scope === 'national'
                    ? 'bg-white font-medium text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                National
              </button>
              <button
                onClick={() => onScopeChange('state')}
                className={`border-r border-stone-200 px-4 py-2 text-sm transition-colors ${
                  scope === 'state'
                    ? 'bg-white font-medium text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                State
              </button>
              <button
                onClick={() => onScopeChange('site')}
                className={`px-4 py-2 text-sm transition-colors ${
                  scope === 'site'
                    ? 'bg-white font-medium text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                Site
              </button>
            </div>

            <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-600 shadow-sm">
              Last 7 Days: {dateRangeLabel}
            </div>

            <button
              onClick={onAlertClick}
              className="relative rounded-full border border-stone-200 p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
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
                  avatarBox: 'h-8 w-8',
                },
              }}
            />
          </div>

          {renderFilters()}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
