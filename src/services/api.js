import axios from 'axios';

let authTokenProvider = null;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
});

export const setAuthTokenProvider = (provider) => {
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
  getOverview: (params) => api.get('/dashboard/overview', { params }),
};

export const sitesAPI = {
  getAll: (params) => api.get('/sites', { params }),
  create: (data) => api.post('/sites', data),
  update: (id, data) => api.patch(`/sites/${id}`, data),
  remove: (id) => api.delete(`/sites/${id}`),
  restore: (id) => api.patch(`/sites/${id}/restore`),
};

export const incidentsAPI = {
  getAll: (params) => api.get('/incidents', { params }),
  create: (data) => api.post('/incidents', data),
  update: (id, data) => api.patch(`/incidents/${id}`, data),
  remove: (id) => api.delete(`/incidents/${id}`),
  restore: (id) => api.patch(`/incidents/${id}/restore`),
};

export const conservationAPI = {
  getAll: (params) => api.get('/conservation', { params }),
  create: (data) => api.post('/conservation', data),
  update: (id, data) => api.patch(`/conservation/${id}`, data),
  remove: (id) => api.delete(`/conservation/${id}`),
  restore: (id) => api.patch(`/conservation/${id}/restore`),
};

export const approvalsAPI = {
  getAll: (params) => api.get('/approvals', { params }),
  create: (data) => api.post('/approvals', data),
  update: (id, data) => api.patch(`/approvals/${id}`, data),
  review: (id, data) => api.patch(`/approvals/${id}/review`, data),
  remove: (id) => api.delete(`/approvals/${id}`),
  restore: (id) => api.patch(`/approvals/${id}/restore`),
};

export const usersAPI = {
  getMe: () => api.get('/users/me'),
};

export default api;
