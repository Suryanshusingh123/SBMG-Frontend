import axios from 'axios';

// Configure your API base URL
// In production (Vercel), use the proxied endpoint
// In development, use the direct backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api/v1' : 'http://139.59.34.99:8000/api/v1');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling 401 errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear stored tokens and user data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getMe: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

export const dashboardAPI = {
  getCEOData: () => apiClient.get('/dashboard/ceo'),
  getBDOData: () => apiClient.get('/dashboard/bdo'),
  getVDOData: () => apiClient.get('/dashboard/vdo'),
};

export const schemesAPI = {
  getSchemes: (params = {}) => {
    const queryParams = new URLSearchParams({
      skip: params.skip || 0,
      limit: params.limit || 100,
      active: params.active !== undefined ? params.active : true,
      ...params
    });
    return apiClient.get(`/schemes/?${queryParams}`);
  },
  createScheme: (schemeData) => {
    return apiClient.post('/schemes/', schemeData);
  },
  uploadSchemeMedia: (schemeId, mediaFile) => {
    const formData = new FormData();
    formData.append('media', mediaFile);
    return apiClient.post(`/schemes/${schemeId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const eventsAPI = {
  getEvents: (params = {}) => {
    const queryParams = new URLSearchParams({
      skip: params.skip || 0,
      limit: params.limit || 100,
      active: params.active !== undefined ? params.active : true,
      ...params
    });
    return apiClient.get(`/events/?${queryParams}`);
  },
  createEvent: (eventData) => {
    return apiClient.post('/events/', eventData);
  },
  uploadEventMedia: (eventId, mediaFile) => {
    const formData = new FormData();
    formData.append('media', mediaFile);
    return apiClient.post(`/events/${eventId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default apiClient;

