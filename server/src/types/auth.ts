export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;  // Add name field
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;  // Change to name to match frontend
    createdAt: string;
    subscription: {
      plan: 'free' | 'premium';
      status: 'active' | 'inactive' | 'cancelled';
      dailyLimit: number;
      dailyUsage: number;
    };
  };
  token: string;
}