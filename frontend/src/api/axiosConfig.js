import axios from 'axios';

// ─── Base URL ──────────────────────────────────
// Hardcoded to the deployed Render backend.
// If you need to test against your local backend, temporarily change
// this to 'http://localhost:5000/api' and remember to switch it back
// before committing.
const API_URL = 'https://learnhub-wr91.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 60000,   // 60s — Render's free tier takes ~30s to wake from sleep
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear state
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if we're not already on /login
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;