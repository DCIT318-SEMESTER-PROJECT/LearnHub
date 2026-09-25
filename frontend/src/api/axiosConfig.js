import axios from 'axios';

// ─── Base URL ──────────────────────────────────
// In local dev: hits your local backend
// In production (Netlify build): uses VITE_API_URL from Netlify env vars
const API_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

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