import { useAuthStore } from '../authStore';
import { ResendVerificationButton } from './ResendVerificationButton';

export function EmailVerificationBanner() {
  const user = useAuthStore((state) => (state.status === 'authenticated' ? state.user : null));

  // Strict check: an older backend without the field must not nag every user
  if (user?.emailVerified !== false) {
    return null;
  }

  return (
    <section aria-label="E-posta doğrulama" className="border-b border-line bg-lane/20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <output className="block text-sm">
          <span className="font-semibold">E-posta adresini doğrula.</span> Doğrulama linkini{' '}
          <span className="font-semibold break-all">{user.email}</span> adresine gönderdik.
        </output>
        <ResendVerificationButton />
      </div>
    </section>
  );
}
