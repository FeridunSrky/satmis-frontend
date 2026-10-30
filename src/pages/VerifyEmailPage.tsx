import { EmailVerificationResult } from '@/features/auth/components/EmailVerificationResult';
import { useLinkToken } from '@/features/auth/hooks/useLinkToken';
import { ButtonLink } from '@/shared/components/Button';
import { StateMessage } from '@/shared/components/StateMessage';

export function VerifyEmailPage() {
  const token = useLinkToken();

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="sr-only">E-posta doğrulama</h1>
      {token ? (
        <EmailVerificationResult token={token} />
      ) : (
        <StateMessage
          tone="error"
          title="Link geçersiz"
          description="Doğrulama linki eksik veya bozuk. E-postadaki linki yeniden açmayı dene."
        >
          <ButtonLink to="/">Ana sayfaya dön</ButtonLink>
        </StateMessage>
      )}
    </div>
  );
}
