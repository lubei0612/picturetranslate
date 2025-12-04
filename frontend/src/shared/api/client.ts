import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle common errors
    if (error.response) {
      const { status } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('auth_token');
          // Could dispatch an event or redirect here
          break;
        case 403:
          console.error('Forbidden: Access denied');
          break;
        case 409:
          // Version conflict - let the caller handle it
          break;
        case 500:
          console.error('Server error');
          break;
      }
    } else if (error.request) {
      console.error('Network error: No response received');
    }
    
    return Promise.reject(error);
  }
);

// Helper methods
export const api = {
  get: <T>(url: string, config?: object) => 
    apiClient.get<T>(url, config).then(res => res.data),
  
  post: <T>(url: string, data?: object, config?: object) => 
    apiClient.post<T>(url, data, config).then(res => res.data),
  
  put: <T>(url: string, data?: object, config?: object) => 
    apiClient.put<T>(url, data, config).then(res => res.data),
  
  patch: <T>(url: string, data?: object, config?: object) => 
    apiClient.patch<T>(url, data, config).then(res => res.data),
  
  delete: <T>(url: string, config?: object) => 
    apiClient.delete<T>(url, config).then(res => res.data),
};

export default apiClient;
