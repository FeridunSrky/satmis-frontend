import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { changePassword, getCurrentUser, updateCurrentUser } from '../api/userApi';

export const currentUserQueryKey = ['users', 'me'] as const;

async function fetchCurrentUser() {
  const user = await getCurrentUser();
  useAuthStore.getState().setUser(user);
  return user;
}

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    enabled: isAuthenticated,
  });
}

/** Refetches the user even when no page observes the query, e.g. after e-mail verification. */
export function useReloadCurrentUser() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.fetchQuery({
      queryKey: currentUserQueryKey,
      queryFn: fetchCurrentUser,
      staleTime: 0,
    });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(currentUserQueryKey, user);
    },
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}
