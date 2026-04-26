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

api.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};

  if ((config.method || 'get').toLowerCase() === 'get') {
    config.headers['Cache-Control'] = 'no-cache';
    config.headers.Pragma = 'no-cache';
    config.headers.Expires = '0';
  }

  if (authTokenProvider) {
    const token = await authTokenProvider();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) console.error('Unauthorized - please sign in');
    if (error.response?.status === 403) console.error('Forbidden - insufficient permissions');
    return Promise.reject(error);
  },
);

export const dashboardAPI = {
  getOverview: (params: { scope: DashboardScope; state?: string; siteId?: string }) =>
    api.get('/dashboard/overview', { params }),
};

export const sitesAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/sites', { params }),
  create: (data: Record<string, unknown>) => api.post('/sites', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/sites/${id}`, data),
  remove: (id: string) => api.delete(`/sites/${id}`),
  restore: (id: string) => api.patch(`/sites/${id}/restore`),
};

export const incidentsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/incidents', { params }),
  create: (data: Record<string, unknown>) => api.post('/incidents', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/incidents/${id}`, data),
  remove: (id: string) => api.delete(`/incidents/${id}`),
  restore: (id: string) => api.patch(`/incidents/${id}/restore`),
};

export const conservationAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/conservation', { params }),
  create: (data: Record<string, unknown>) => api.post('/conservation', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/conservation/${id}`, data),
  remove: (id: string) => api.delete(`/conservation/${id}`),
  restore: (id: string) => api.patch(`/conservation/${id}/restore`),
};

export const approvalsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/approvals', { params }),
  create: (data: Record<string, unknown>) => api.post('/approvals', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/approvals/${id}`, data),
  review: (id: string, data: Record<string, unknown>) => api.patch(`/approvals/${id}/review`, data),
  remove: (id: string) => api.delete(`/approvals/${id}`),
  restore: (id: string) => api.patch(`/approvals/${id}/restore`),
};

export const usersAPI = {
  getMe: () => api.get('/users/me'),
};

export default api;
