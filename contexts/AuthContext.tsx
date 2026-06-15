import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, clearSession, getStoredUser, saveSession, User, UserType } from '@/services/api';

interface AuthState {
  user: (User & { user_type: UserType }) | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (login: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    getStoredUser().then((user) => {
      setState({ user, isLoading: false, isAuthenticated: !!user });
    });
  }, []);

  async function login(loginInput: string, senha: string) {
    const res = await api.login(loginInput, senha);
    await saveSession(res.token, res.user, res.user_type);
    setState({
      user: { ...res.user, user_type: res.user_type },
      isLoading: false,
      isAuthenticated: true,
    });
  }

  async function logout() {
    try {
      await api.logout();
    } catch (_) {
      // silently ignore network errors on logout
    }
    await clearSession();
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
