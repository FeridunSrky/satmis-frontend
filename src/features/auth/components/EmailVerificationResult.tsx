import { useEffect, useRef } from 'react';
import { toApiError } from '@/shared/api/apiError';
import { ButtonLink } from '@/shared/components/Button';
import { StateMessage } from '@/shared/components/StateMessage';
import { useAuthStore } from '../authStore';
import { useVerifyEmail } from '../hooks/useEmailVerification';
import { ResendVerificationButton } from './ResendVerificationButton';

interface EmailVerificationResultProps {
  token: string;
}

export function EmailVerificationResult({ token }: EmailVerificationResultProps) {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const { mutate: verify, status, error } = useVerifyEmail();
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    // Tokens are single-use: StrictMode's second effect run must not send it again
    if (hasSubmittedRef.current) {
      return;
    }
    hasSubmittedRef.current = true;
    verify(token);
  }, [verify, token]);

  if (status === 'success') {
    return (
      <StateMessage title="E-posta adresin doğrulandı" description="Artık ilan verebilirsin.">
        {isAuthenticated ? (
          <ButtonLink to="/ilan-ver">İlan ver</ButtonLink>
        ) : (
          <ButtonLink to="/giris">Giriş yap</ButtonLink>
        )}
      </StateMessage>
    );
  }

  if (status === 'error') {
    return (
      <StateMessage
        tone="error"
        title="E-posta doğrulanamadı"
        description={toApiError(error).message}
      >
        {isAuthenticated ? (
          <ResendVerificationButton label="Yeni link gönder" />
        ) : (
          <p className="text-muted">
            Giriş yapıp yeni link iste.{' '}
            <ButtonLink to="/giris" variant="secondary" className="ml-2">
              Giriş yap
            </ButtonLink>
          </p>
        )}
      </StateMessage>
    );
  }

  return (
    <output className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <span className="lane-dashes h-1 w-32 animate-pulse rounded" aria-hidden="true" />
      <span className="text-sm font-medium text-muted">E-posta adresin doğrulanıyor...</span>
    </output>
  );
}
