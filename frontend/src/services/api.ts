import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Attach Authorization token to outgoing requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('logicforge_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Standardized error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired/unauthorized
      localStorage.removeItem('logicforge_token');
      localStorage.removeItem('logicforge_user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
