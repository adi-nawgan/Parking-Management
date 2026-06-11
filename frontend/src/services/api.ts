import axios, { AxiosResponse } from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const baseURL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`;

const API = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

API.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: { response?: { status: number } }) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized access detected. Logging out...');
      localStorage.removeItem('spms_admin');
      localStorage.removeItem('member_spms_data');
      window.dispatchEvent(new Event('auth_session_expired'));
    }
    return Promise.reject(error);
  }
);

export default API;
