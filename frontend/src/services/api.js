// smart-inventory/frontend/src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — Token нэмэх ────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('si_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor — Error handling ─────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || 'Сүлжээний алдаа гарлаа';

    if (err.response?.status === 401) {
      localStorage.removeItem('si_token');
      localStorage.removeItem('si_user');
      window.location.href = '/auth';
      return Promise.reject(err);
    }

    toast.error(message);
    return Promise.reject(err);
  }
);

export default api;
