import { toast } from 'sonner';
import { useReloadCurrentUser } from '@/features/user/hooks/useUserQueries';
import { toApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { useRetryCooldown } from '@/shared/hooks/useRetryCooldown';
import { useResendVerificationEmail } from '../hooks/useEmailVerification';

const HTTP_CONFLICT = 409;

interface ResendVerificationButtonProps {
  label?: string;
}

export function ResendVerificationButton({
  label = 'Tekrar gönder',
}: ResendVerificationButtonProps) {
  const resendVerification = useResendVerificationEmail();
  const reloadCurrentUser = useReloadCurrentUser();
  const { isCoolingDown, startCooldown } = useRetryCooldown();

  const handleError = (error: unknown) => {
    const apiError = toApiError(error);
    // 409: already verified, e.g. in another tab; reloading the user removes the prompts
    if (apiError.kind === 'http' && apiError.status === HTTP_CONFLICT) {
      reloadCurrentUser().catch((reloadError: unknown) => {
        toast.error(toApiError(reloadError).message);
      });
      return;
    }
    startCooldown(apiError);
    toast.error(apiError.message);
  };

  const handleClick = () => {
    resendVerification.mutate(undefined, {
      onSuccess: () => toast.success('Yeni doğrulama linki gönderildi'),
      onError: handleError,
    });
  };

  return (
    <Button
      variant="secondary"
      onClick={handleClick}
      disabled={resendVerification.isPending || isCoolingDown}
    >
      {resendVerification.isPending ? 'Gönderiliyor...' : label}
    </Button>
  );
}
