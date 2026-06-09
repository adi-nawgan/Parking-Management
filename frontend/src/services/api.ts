import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('spms_token') || localStorage.getItem('member_spms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: { response?: { status: number } }) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized access detected. Logging out...');
      localStorage.removeItem('spms_token');
      localStorage.removeItem('spms_admin');
      localStorage.removeItem('member_spms_token');
      localStorage.removeItem('member_spms_data');
      window.dispatchEvent(new Event('auth_session_expired'));
    }
    return Promise.reject(error);
  }
);

export default API;
