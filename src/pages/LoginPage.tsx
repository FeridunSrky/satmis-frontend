import { Link, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { LoginForm } from '@/features/auth/components/LoginForm';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  // Keep ?next= when switching to registration so the user still lands where they were going
  const registerPath = searchParams.has('next') ? `/kayit?${searchParams.toString()}` : '/kayit';

  return (
    <AuthShell
      title="Giriş yap"
      subtitle="İlanlarına ve hesap bilgilerine erişmek için giriş yap."
      footer={
        <>
          Hesabın yok mu?{' '}
          <Link
            to={registerPath}
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            Kayıt ol
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
