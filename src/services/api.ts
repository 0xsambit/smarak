import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
});

// Function to set auth token (will be called from components with Clerk token)
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Response interceptor for error handling
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
  }
);

// API endpoints
export const dashboardAPI = {
  getOverview: (scope: string, state?: string, siteId?: string) => {
    const params: any = { scope };
    if (state) params.state = state;
    if (siteId) params.siteId = siteId;
    return api.get('/dashboard/overview', { params });
  },
};

export const sitesAPI = {
  getAll: (params?: any) => api.get('/sites', { params }),
  getById: (id: string) => api.get(`/sites/${id}`),
  getNearby: (latitude: number, longitude: number, maxDistance?: number) =>
    api.get('/sites/nearby', { params: { latitude, longitude, maxDistance } }),
  getStatistics: (id: string) => api.get(`/sites/${id}/statistics`),
};

export const incidentsAPI = {
  getAll: (params?: any) => api.get('/incidents', { params }),
  getById: (id: string) => api.get(`/incidents/${id}`),
  create: (data: any) => api.post('/incidents', data),
  update: (id: string, data: any) => api.patch(`/incidents/${id}`, data),
};

export const conservationAPI = {
  getAll: (params?: any) => api.get('/conservation', { params }),
  getById: (id: string) => api.get(`/conservation/${id}`),
};

export const approvalsAPI = {
  getAll: (params?: any) => api.get('/approvals', { params }),
  getById: (id: string) => api.get(`/approvals/${id}`),
  review: (id: string, data: any) => api.patch(`/approvals/${id}/review`, data),
};

export const usersAPI = {
  getMe: () => api.get('/users/me'),
  getAll: (params?: any) => api.get('/users', { params }),
};

export default api;