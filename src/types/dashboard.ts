export type DashboardScope = 'national' | 'state' | 'site';

export interface DashboardKpis {
  totalSites: number;
  highRiskSites: number;
  activeIncidents: number;
  pendingApprovals: number;
  conservationOngoing: number;
  visitorCapacity: number;
}

export interface IncidentsBySeverity {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  text: string;
  site: string;
  time: string;
  user: string;
}

export interface RegionSummary {
  name: string;
  sites: number;
  alerts: number;
  status: string;
}

export interface CriticalAlert {
  id: string;
  site: string;
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  daysOpen: number;
  canRespond: boolean;
}

export interface PendingApproval {
  id: string;
  type: string;
  title: string;
  description: string;
  site: string;
  submittedBy: string;
  priority: 'High' | 'Normal';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewNotes: string;
}

export interface DashboardOverview {
  kpis: DashboardKpis;
  incidentsBySeverity: IncidentsBySeverity;
  footfallTrend: Array<{ day: string; visitors: number }>;
  recentActivity: RecentActivity[];
  regionSummary: RegionSummary[];
  criticalAlerts: CriticalAlert[];
  pendingApprovals: PendingApproval[];
}

export interface SiteSummary {
  _id: string;
  name: string;
  state: string;
  district: string;
  riskLevel: string;
  protectionStatus: string;
  visitorCapacity: number;
}

export interface CurrentUserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  siteId?: string;
  stateId?: string;
}
