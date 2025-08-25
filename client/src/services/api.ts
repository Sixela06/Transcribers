import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle common errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

async get<T>(url: string): Promise<T> {
  const response = await this.client.get(url);
  return response.data;
}

async post<T>(url: string, data?: any): Promise<T> {
  const response = await this.client.post(url, data);
  return response.data;
}

async put<T>(url: string, data?: any): Promise<T> {
  const response = await this.client.put(url, data);
  return response.data;
}

async delete<T>(url: string): Promise<T> {
  const response = await this.client.delete(url);
  return response.data;
}
}

export const apiService = new ApiService();