import { useMutation } from '@tanstack/react-query';
import { useReloadCurrentUser } from '@/features/user/hooks/useUserQueries';
import { resendVerificationEmail, verifyEmail } from '../api/authApi';
import { useAuthStore } from '../authStore';

export function useVerifyEmail() {
  const reloadCurrentUser = useReloadCurrentUser();
  return useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => {
      if (useAuthStore.getState().status !== 'authenticated') {
        return;
      }
      // Not awaited: the address is verified either way, only the banner may lag behind
      reloadCurrentUser().catch(() => {
        console.warn('Reloading the user after e-mail verification failed.');
      });
    },
  });
}

export function useResendVerificationEmail() {
  return useMutation({ mutationFn: resendVerificationEmail });
}
