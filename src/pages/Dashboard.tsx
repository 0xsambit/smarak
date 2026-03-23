import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ActionQueue from '../components/dashboard/ActionQueue';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import FootfallSnapshot from '../components/dashboard/FootfallSnapshot';
import KPIGrid from '../components/dashboard/KPIGrid';
import RiskAlertPanel from '../components/dashboard/RiskAlertPanel';
import SiteStatusMap from '../components/dashboard/SiteStatusMap';
import { approvalsAPI, dashboardAPI, incidentsAPI, setAuthTokenProvider, sitesAPI, usersAPI } from '../services/api';
import type { CurrentUserProfile, DashboardOverview, DashboardScope, SiteSummary } from '../types/dashboard';

const EMPTY_OVERVIEW: DashboardOverview = {
  kpis: {
    totalSites: 0,
    highRiskSites: 0,
    activeIncidents: 0,
    pendingApprovals: 0,
    conservationOngoing: 0,
    visitorCapacity: 0,
  },
  incidentsBySeverity: {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
  },
  footfallTrend: [],
  recentActivity: [],
  regionSummary: [],
  criticalAlerts: [],
  pendingApprovals: [],
};

const buildDateRangeLabel = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);

  const format = (date: Date) =>
    date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });

  return `${format(start)} - ${format(end)}`;
};

const Dashboard: React.FC = () => {
  const [scope, setScope] = useState<DashboardScope>('national');
  const [selectedState, setSelectedState] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [allSites, setAllSites] = useState<SiteSummary[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUserProfile | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardOverview>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [contextReady, setContextReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    setAuthTokenProvider(() => getToken());
    return () => setAuthTokenProvider(null);
  }, [getToken, isLoaded]);

  const stateOptions = useMemo(
    () => Array.from(new Set(allSites.map((site) => site.state))).sort((left, right) => left.localeCompare(right)),
    [allSites],
  );

  const siteOptions = useMemo(() => {
    if (!selectedState) {
      return allSites;
    }

    return allSites.filter((site) => site.state === selectedState);
  }, [allSites, selectedState]);

  const selectedSite = useMemo(
    () => allSites.find((site) => site._id === selectedSiteId) || null,
    [allSites, selectedSiteId],
  );

  const headerTitle = useMemo(() => {
    if (scope === 'national') {
      return 'National Operations Dashboard';
    }

    if (scope === 'state') {
      return selectedState ? `${selectedState} Operations Dashboard` : 'State Operations Dashboard';
    }

    return selectedSite?.name || 'Site Operations Dashboard';
  }, [scope, selectedState, selectedSite]);

  const headerSubtitle = useMemo(() => {
    if (scope === 'national') {
      return 'All monitored heritage sites';
    }

    if (scope === 'state') {
      return selectedState ? `${siteOptions.length} monitored sites in ${selectedState}` : 'Select a state to continue';
    }

    return selectedSite ? `${selectedSite.district}, ${selectedSite.state}` : 'Select a site to continue';
  }, [scope, selectedState, selectedSite, siteOptions.length]);

  const fetchDashboardData = useCallback(async () => {
    if (!isLoaded || !contextReady) {
      return;
    }

    if (scope === 'state' && !selectedState) {
      setDashboardData(EMPTY_OVERVIEW);
      return;
    }

    if (scope === 'site' && !selectedSiteId) {
      setDashboardData(EMPTY_OVERVIEW);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await dashboardAPI.getOverview({
        scope,
        state: scope === 'state' || scope === 'site' ? selectedState : undefined,
        siteId: scope === 'site' ? selectedSiteId : undefined,
      });
      setDashboardData(data);
    } catch (dashboardError: any) {
      setError(dashboardError?.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [contextReady, isLoaded, scope, selectedSiteId, selectedState]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let cancelled = false;

    const initializeDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const [sitesResponse, meResponse] = await Promise.all([
          sitesAPI.getAll({ limit: 1000 }),
          usersAPI.getMe(),
        ]);

        if (cancelled) {
          return;
        }

        const sites = sitesResponse.data?.sites || [];
        const user = meResponse.data as CurrentUserProfile;
        const preferredSite = sites.find((site: SiteSummary) => site._id === user.siteId) || sites[0] || null;

        setAllSites(sites);
        setCurrentUser(user);
        setSelectedState((current) => current || preferredSite?.state || '');
        setSelectedSiteId((current) => current || preferredSite?._id || '');
        setContextReady(true);
      } catch (contextError: any) {
        if (!cancelled) {
          setError(contextError?.response?.data?.message || 'Failed to initialize dashboard.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeDashboard();

    return () => {
      cancelled = true;
    };
  }, [isLoaded]);

  useEffect(() => {
    if (!allSites.length) {
      setSelectedSiteId('');
      return;
    }

    if (!selectedState) {
      setSelectedState(allSites[0].state);
      return;
    }

    const matchingSites = allSites.filter((site) => site.state === selectedState);

    if (matchingSites.length === 0) {
      setSelectedSiteId('');
      return;
    }

    if (!matchingSites.some((site) => site._id === selectedSiteId)) {
      setSelectedSiteId(matchingSites[0]._id);
    }
  }, [allSites, selectedSiteId, selectedState]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleApprovalReview = useCallback(
    async (approvalId: string, status: 'APPROVED' | 'REJECTED', reviewNotes: string) => {
      await approvalsAPI.review(approvalId, { status, reviewNotes });
      await fetchDashboardData();
    },
    [fetchDashboardData],
  );

  const handleIncidentRespond = useCallback(
    async (incidentId: string) => {
      await incidentsAPI.update(incidentId, { status: 'IN_PROGRESS' });
      await fetchDashboardData();
    },
    [fetchDashboardData],
  );

  if (!isLoaded || (loading && !contextReady)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-stone-900"></div>
          <p className="text-stone-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !contextReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="font-semibold text-red-800">Unable to load dashboard</h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <DashboardHeader
        scope={scope}
        title={headerTitle}
        subtitle={headerSubtitle}
        dateRangeLabel={buildDateRangeLabel()}
        stateOptions={stateOptions}
        selectedState={selectedState}
        siteOptions={siteOptions}
        selectedSiteId={selectedSiteId}
        criticalCount={dashboardData.incidentsBySeverity.HIGH}
        onScopeChange={setScope}
        onStateChange={setSelectedState}
        onSiteChange={setSelectedSiteId}
        onAlertClick={() => {
          document.getElementById('critical-alerts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

      <main className="mx-auto max-w-[1600px] space-y-6 p-6">
        {error ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        ) : null}

        <section>
          <KPIGrid scope={scope} kpis={dashboardData.kpis} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SiteStatusMap scope={scope} regionSummary={dashboardData.regionSummary} />
          </div>
          <div className="lg:col-span-1">
            <RiskAlertPanel
              scope={scope}
              incidentsBySeverity={dashboardData.incidentsBySeverity}
              alerts={dashboardData.criticalAlerts}
              onRespond={handleIncidentRespond}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ActionQueue
              approvals={dashboardData.pendingApprovals}
              currentUserRole={currentUser?.role}
              onReview={handleApprovalReview}
            />
          </div>
          <div className="flex flex-col gap-6 xl:col-span-1">
            <div className="h-64">
              <FootfallSnapshot scope={scope} footfallTrend={dashboardData.footfallTrend} />
            </div>
            <div className="min-h-[20rem] flex-1">
              <ActivityTimeline scope={scope} recentActivity={dashboardData.recentActivity} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
