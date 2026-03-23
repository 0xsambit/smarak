import axios from 'axios';
import type { DashboardScope } from '../types/dashboard';

type AuthTokenProvider = () => Promise<string | null>;

let authTokenProvider: AuthTokenProvider | null = null;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
});

export const setAuthTokenProvider = (provider: AuthTokenProvider | null) => {
  authTokenProvider = provider;
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

api.interceptors.request.use(async (config) => {
  if (!authTokenProvider) {
    return config;
  }

  const token = await authTokenProvider();

  if (!token) {
    return config;
  }

  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized - please sign in');
    }
    if (error.response?.status === 403) {
      console.error('Forbidden - insufficient permissions');
    }
    return Promise.reject(error);
  },
);

export const dashboardAPI = {
  getOverview: (params: { scope: DashboardScope; state?: string; siteId?: string }) =>
    api.get('/dashboard/overview', { params }),
};

export const sitesAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/sites', { params }),
  getById: (id: string) => api.get(`/sites/${id}`),
  getNearby: (latitude: number, longitude: number, maxDistance?: number) =>
    api.get('/sites/nearby', { params: { latitude, longitude, maxDistance } }),
  getStatistics: (id: string) => api.get(`/sites/${id}/statistics`),
};

export const incidentsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/incidents', { params }),
  getById: (id: string) => api.get(`/incidents/${id}`),
  create: (data: Record<string, unknown>) => api.post('/incidents', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/incidents/${id}`, data),
};

export const conservationAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/conservation', { params }),
  getById: (id: string) => api.get(`/conservation/${id}`),
};

export const approvalsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/approvals', { params }),
  getById: (id: string) => api.get(`/approvals/${id}`),
  review: (id: string, data: Record<string, unknown>) => api.patch(`/approvals/${id}/review`, data),
};

export const usersAPI = {
  getMe: () => api.get('/users/me'),
  getAll: (params?: Record<string, unknown>) => api.get('/users', { params }),
};

export default api;
