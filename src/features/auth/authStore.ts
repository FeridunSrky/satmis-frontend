import { create } from 'zustand';
import type { AuthResponse, UserResponse } from '@/shared/api/types';
import { removeRefreshToken, writeRefreshToken } from './tokenStorage';

export type AuthStatus = 'bootstrapping' | 'authenticated' | 'anonymous';

interface AuthState {
  status: AuthStatus;
  user: UserResponse | null;
  // Kept in memory only, never persisted
  accessToken: string | null;
  setSession: (session: AuthResponse) => void;
  setUser: (user: UserResponse) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'bootstrapping',
  user: null,
  accessToken: null,
  setSession: (session) => {
    writeRefreshToken(session.refreshToken);
    set({ status: 'authenticated', user: session.user, accessToken: session.accessToken });
  },
  setUser: (user) => set({ user }),
  clearSession: () => {
    removeRefreshToken();
    set({ status: 'anonymous', user: null, accessToken: null });
  },
}));
