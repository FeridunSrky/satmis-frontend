import { Link } from 'react-router-dom';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Şifremi unuttum"
      subtitle="Hesabının e-posta adresini gir, şifreni sıfırlaman için bir link gönderelim."
      footer={
        <>
          Şifreni hatırladın mı?{' '}
          <Link
            to="/giris"
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            Giriş yap
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
