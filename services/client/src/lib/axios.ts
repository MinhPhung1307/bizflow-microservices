import axios from 'axios';
import 'dotenv/config';

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn Token vào mỗi request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token'); 
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Xử lý response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Lấy config của request gốc để kiểm tra URL
    const originalRequest = error.config;

    // Kiểm tra nếu lỗi là 401
    if (error.response?.status === 401) {
      
      // QUAN TRỌNG: Nếu URL là '/login' thì KHÔNG được redirect
      // (để cho component Login tự xử lý hiển thị lỗi sai mật khẩu)
      if (originalRequest.url && !originalRequest.url.includes('/login')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;