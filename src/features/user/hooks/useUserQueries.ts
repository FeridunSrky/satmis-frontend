import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { changePassword, getCurrentUser, updateCurrentUser } from '../api/userApi';

export const currentUserQueryKey = ['users', 'me'] as const;

export function useCurrentUser() {
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: async () => {
      const user = await getCurrentUser();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
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
