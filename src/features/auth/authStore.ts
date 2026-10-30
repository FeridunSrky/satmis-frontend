import { create } from 'zustand';
import type { AuthResponse, UserResponse } from '@/shared/api/types';

export type AuthStatus = 'bootstrapping' | 'authenticated' | 'anonymous';

interface AuthState {
  status: AuthStatus;
  // Kept in memory only, never persisted: a reload restores both through the refresh cookie
  user: UserResponse | null;
  accessToken: string | null;
  setSession: (session: AuthResponse) => void;
  setUser: (user: UserResponse) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'bootstrapping',
  user: null,
  accessToken: null,
  setSession: (session) =>
    set({ status: 'authenticated', user: session.user, accessToken: session.accessToken }),
  setUser: (user) => set({ user }),
  clearSession: () => set({ status: 'anonymous', user: null, accessToken: null }),
}));
