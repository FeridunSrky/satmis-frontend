import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { login, register } from '../api/authApi';
import { useAuthStore } from '../authStore';
import { endSession } from '../endSession';

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({ mutationFn: login, onSuccess: setSession });
}

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({ mutationFn: register, onSuccess: setSession });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useCallback(() => endSession(queryClient), [queryClient]);
}
