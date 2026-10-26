import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { AuthResponse } from '@/shared/api/types';
import { login, register } from '../api/authApi';
import { useAuthStore } from '../authStore';
import { endSession } from '../endSession';

// Data fetched while anonymous (seller phones, favorite flags) differs once signed in
function useStartSession() {
  const setSession = useAuthStore((state) => state.setSession);
  const queryClient = useQueryClient();
  return (session: AuthResponse) => {
    setSession(session);
    void queryClient.invalidateQueries();
  };
}

export function useLogin() {
  return useMutation({ mutationFn: login, onSuccess: useStartSession() });
}

export function useRegister() {
  return useMutation({ mutationFn: register, onSuccess: useStartSession() });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useCallback(() => endSession(queryClient), [queryClient]);
}
