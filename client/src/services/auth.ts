import { apiService } from './api';
import { AuthResponse, LoginRequest, SignupRequest, User } from '../types/auth';

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  return apiService.post<AuthResponse>('/auth/login', data);
};

export const signup = async (data: SignupRequest): Promise<AuthResponse> => {
  return apiService.post<AuthResponse>('/auth/register', data);
};

export const verifyToken = async (): Promise<User> => {
  return apiService.get<User>('/auth/me');
};

export const logout = async (): Promise<void> => {
  return apiService.post<void>('/auth/logout');
};

export const deleteAccount = async (): Promise<void> => {
  return apiService.delete<void>('/user/delete-account');
};