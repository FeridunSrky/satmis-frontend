import { Link, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const loginPath = searchParams.has('next') ? `/giris?${searchParams.toString()}` : '/giris';

  return (
    <AuthShell
      title="Hesap oluştur"
      subtitle="Ücretsiz hesabınla ilan verebilir, beğendiğin araçları kaydedebilirsin."
      footer={
        <>
          Zaten hesabın var mı?{' '}
          <Link
            to={loginPath}
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            Giriş yap
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
