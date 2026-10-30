import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { useLinkToken } from '@/features/auth/hooks/useLinkToken';
import { ButtonLink } from '@/shared/components/Button';
import { FormAlert } from '@/shared/components/FormAlert';

const MISSING_TOKEN_MESSAGE = 'Link geçersiz. E-postadaki linki yeniden açmayı dene.';

export function ResetPasswordPage() {
  const token = useLinkToken();
  const [rejectedLinkMessage, setRejectedLinkMessage] = useState<string | null>(null);
  const invalidLinkMessage = token ? rejectedLinkMessage : MISSING_TOKEN_MESSAGE;

  return (
    <AuthShell
      title="Yeni şifre belirle"
      subtitle="Hesabın için yeni bir şifre seç."
      footer={
        <Link
          to="/giris"
          className="font-semibold text-brand-700 underline-offset-4 hover:underline"
        >
          Giriş sayfasına dön
        </Link>
      }
    >
      {token && !invalidLinkMessage ? (
        <ResetPasswordForm token={token} onLinkRejected={setRejectedLinkMessage} />
      ) : (
        <div className="flex flex-col gap-5">
          <FormAlert message={invalidLinkMessage ?? undefined} />
          <ButtonLink to="/sifremi-unuttum" size="lg" fullWidth>
            Yeni link iste
          </ButtonLink>
        </div>
      )}
    </AuthShell>
  );
}
