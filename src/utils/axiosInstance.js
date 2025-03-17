import axios from 'axios';
import { message } from 'antd';
const API_URL = 'http://192.168.100.47:2003/api/';
// const API_URL = 'https://localhost:7024/api/';
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
let isRefreshing = false;
let refreshSubscribers = [];
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};
const onRefreshed = (newAccessToken) => {
  refreshSubscribers.forEach((callback) => callback(newAccessToken));
  refreshSubscribers = [];
};


axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});



























axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('🚨 API Error:', error); // Log lỗi tổng quát
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('⚠️ 401 Unauthorized detected! Attempting token refresh...');
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const refreshToken = localStorage.getItem('refreshToken');
        console.log('🔍 Current refresh token:', refreshToken);
        if (!refreshToken) {
          console.error('❌ No refresh token found, logging out...');
          isRefreshing = false;
          localStorage.setItem('token', '');
          localStorage.setItem('refreshToken', '');
          message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!');
          // window.location.href = '/';
          return Promise.reject(new Error('No refresh token available'));
        }

        try {
          const refreshResponse = await axiosInstance.post('/v1/HeThongNguoiDung/LamMoiToken', { RefreshToken: refreshToken });
          if (refreshResponse.data.Status === 1) {
            const newAccessToken = refreshResponse.data.Data;
            const newRefreshToken = refreshResponse.data.RefreshToken;

            localStorage.setItem('token', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            onRefreshed(newAccessToken);
          } else {
            throw new Error('❌ Token refresh failed: Invalid response status');
          }
        } catch (refreshError) {
          console.error('🚨 Error refreshing token:', refreshError);
          localStorage.setItem('token', '');
          localStorage.setItem('refreshToken', '');
          message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!');
          // window.location.href = '/';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          resolve(axiosInstance(originalRequest));
        });
      });
    }

    console.error('❌ API request failed:', error);
    return Promise.reject(error);
  }
);






















export const handleLoginSuccess = (newAccessToken, newRefreshToken) => {
  if (newAccessToken && newRefreshToken) {
    localStorage.setItem('token', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
  } else {
    console.error('Invalid tokens provided.');
  }
};
export default axiosInstance;