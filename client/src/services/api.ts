import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      timeout: 60000, // Increased timeout for AI operations (60 seconds)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token and debug logging
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add auth token from localStorage
        const token = localStorage.getItem('token');
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
            headers: config.headers
          });
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle common errors and debug logging
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            data: response.data,
            status: response.status
          });
        }
        return response;
      },
      (error) => {
        // Enhanced error logging
        console.error('❌ API Error:', {
          message: error.message,
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
        
        // Handle unauthorized responses
        if (error.response?.status === 401) {
          console.warn('🔐 Unauthorized request - clearing token and redirecting to login');
          localStorage.removeItem('token');
          
          // Only redirect if we're not already on an auth page
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/') {
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // GET request with optional query parameters
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  // POST request
  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  // PUT request
  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  // DELETE request
  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  // PATCH request
  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  // Utility method to get base URL
  getBaseURL(): string {
    return this.client.defaults.baseURL || '';
  }

  // Method to update auth token without recreating the instance
  setAuthToken(token: string | null): void {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete this.client.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }

  // Method to check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  // Method to clear authentication
  clearAuth(): void {
    this.setAuthToken(null);
  }
}

// Export singleton instance
export const apiService = new ApiService();