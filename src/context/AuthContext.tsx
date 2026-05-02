import React, { createContext, useContext, useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { User, Tenant } from '../types';
import { api } from '../lib/api';
import { removeLegacyPendingBookingKey } from '../lib/bookingDraft';

type AuthUser = User | Tenant;

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: 'admin' | 'tenant' }>;
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: 'admin' | 'tenant',
    phone?: string
  ) => Promise<{ success: boolean; role?: 'admin' | 'tenant'; error?: string }>;
  logout: () => Promise<void>;
  error: string | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    removeLegacyPendingBookingKey();
    const boot = async () => {
      const token = localStorage.getItem('rms_access');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get<{ user: AuthUser }>('/api/auth/me');
        setUser(data.user);
        localStorage.setItem('rms_user', JSON.stringify(data.user));
      } catch {
        localStorage.removeItem('rms_access');
        localStorage.removeItem('rms_refresh');
        localStorage.removeItem('rms_user');
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post<{
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
      }>('/api/auth/login', { email, password });

      localStorage.setItem('rms_access', data.accessToken);
      localStorage.setItem('rms_refresh', data.refreshToken);
      localStorage.setItem('rms_user', JSON.stringify(data.user));
      setUser(data.user);
      setLoading(false);
      return { success: true, role: data.user.role };
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Invalid email or password');
        } else if (typeof err.response?.data?.message === 'string') {
          setError(err.response.data.message);
        } else if (!err.response) {
          setError(
            'Cannot reach the server. If you open the app via a public URL, set FRONTEND_URL on the API to that origin (comma-separated), or leave VITE_API_URL empty and proxy through the same dev server.'
          );
        } else {
          setError('Sign in failed. Please try again.');
        }
      } else if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError('Invalid email or password');
      }
      setLoading(false);
      return { success: false };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: 'admin' | 'tenant',
    phone?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<{
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
      }>('/api/auth/register', { name, email, password, confirmPassword, role, phone });
      localStorage.setItem('rms_access', data.accessToken);
      localStorage.setItem('rms_refresh', data.refreshToken);
      localStorage.setItem('rms_user', JSON.stringify(data.user));
      setUser(data.user);
      setLoading(false);
      return { success: true, role: data.user.role };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Registration failed. Please try again.';
      setError(message);
      setLoading(false);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    const refresh = localStorage.getItem('rms_refresh');
    try {
      await api.post('/api/auth/logout', { refreshToken: refresh });
    } catch {
      /* ignore */
    }
    setUser(null);
    localStorage.removeItem('rms_access');
    localStorage.removeItem('rms_refresh');
    localStorage.removeItem('rms_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};
