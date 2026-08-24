import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types/index.js';
import { authApi } from '../services/api.js';
import { useToast } from './ToastContext.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  demoLogin: (role: Role) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('carepulse_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { success, error } = useToast();

  const fetchCurrentUser = useCallback(async () => {
    try {
      if (!localStorage.getItem('carepulse_token')) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const res = await authApi.getMe();
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
      }
    } catch (err: any) {
      console.warn('Session check failed or expired');
      localStorage.removeItem('carepulse_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await authApi.login({ email, password: pass });
      if (res.data.success) {
        localStorage.setItem('carepulse_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        success(`Welcome back, ${res.data.user.name}!`);
        return true;
      }
      return false;
    } catch (err: any) {
      error(err.response?.data?.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await authApi.register(data);
      if (res.data.success) {
        localStorage.setItem('carepulse_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        success('Account created successfully!');
        return true;
      }
      return false;
    } catch (err: any) {
      error(err.response?.data?.message || 'Registration failed.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: Role): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await authApi.demoLogin(role);
      if (res.data.success) {
        localStorage.setItem('carepulse_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        success(`Switched persona to: ${res.data.user.name} (${role})`);
        return true;
      }
      return false;
    } catch (err: any) {
      error(err.response?.data?.message || `Demo login for ${role} failed.`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('carepulse_token');
    setToken(null);
    setUser(null);
    success('You have been logged out.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
