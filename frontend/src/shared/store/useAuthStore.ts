import { create } from 'zustand';
import client from '../api/client';

interface User {
  id: string;
  nickname: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    set({ user, accessToken: token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
  checkAuth: async () => {
    try {
      const response = await client.post('/auth/refresh');
      const { user, accessToken } = response.data;
      localStorage.setItem('access_token', accessToken);
      set({ user, accessToken, isAuthenticated: true });
    } catch {
      localStorage.removeItem('access_token');
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },
}));
