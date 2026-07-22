import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const client = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ───────────────────────────────────────────────────────
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gittrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ──────────────────────────────────────────────────────
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Network error';
    const status  = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('gittrack_token');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject({ message, status });
  }
);

export default client;
