export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  subscription?: {
    plan: 'free' | 'premium';
    status: 'active' | 'inactive' | 'cancelled';
    dailyLimit: number;
    dailyUsage: number;
  };
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>; // ADD this line
  loading: boolean;
  isAuthenticated: boolean;
}