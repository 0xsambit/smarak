export type ProtectionStatus = 'PROTECTED' | 'RESTRICTED' | 'OPEN';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SiteGeoCoordinates {
  type: 'Point';
  coordinates: [number, number];
}

export interface SiteRecord {
  _id: string;
  name: string;
  state: string;
  district: string;
  coordinates: SiteGeoCoordinates;
  protectionStatus: ProtectionStatus;
  riskLevel: RiskLevel;
  visitorCapacity: number;
  lastInspectionDate?: string;
  description?: string;
  isDeleted?: boolean;
}

export interface SitesListResponse {
  sites: SiteRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface SiteFormValues {
  name: string;
  state: string;
  district: string;
  longitude: string;
  latitude: string;
  protectionStatus: ProtectionStatus;
  riskLevel: RiskLevel;
  visitorCapacity: string;
  lastInspectionDate: string;
  description: string;
}
