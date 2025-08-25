import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthContextType } from '../types/auth';
import toast from 'react-hot-toast';
import { login as authLogin, signup as authSignup, verifyToken, deleteAccount as authDeleteAccount } from '../services/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await verifyToken();
          setUser(userData);
        }
      } catch (error) {
        localStorage.removeItem('token');
        console.error('Token verification failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const authResponse = await authLogin({ email, password });
      setUser(authResponse.user);
      localStorage.setItem('token', authResponse.token);
      toast.success('Welcome back!');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      const authResponse = await authSignup({ name, email, password });
      setUser(authResponse.user);
      localStorage.setItem('token', authResponse.token);
      toast.success('Account created successfully!');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Signup failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
  };

  const deleteAccount = async () => {
  try {
    setLoading(true);
    await authDeleteAccount();
    setUser(null);
    localStorage.removeItem('token');
    toast.success('Account deleted successfully');
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to delete account';
    toast.error(message);
    throw error;
  } finally {
    setLoading(false);
  }
};

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    deleteAccount, // ADD this line
    loading,
    isAuthenticated: !!user,
};

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};