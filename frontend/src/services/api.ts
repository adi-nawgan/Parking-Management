import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const baseURL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`;

const API = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Inject Bearer token from localStorage on every request
API.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: { response?: { status: number } }) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized access detected. Logging out...');
      localStorage.removeItem('spms_admin');
      localStorage.removeItem('member_spms_data');
      localStorage.removeItem('auth_token');
      window.dispatchEvent(new Event('auth_session_expired'));
    }
    return Promise.reject(error);
  }
);

export default API;
