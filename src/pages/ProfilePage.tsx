import type { ReactNode } from 'react';
import { getInitials } from '@/shared/lib/getInitials';
import { useAuthStore } from '@/features/auth/authStore';
import { ChangePasswordForm } from '@/features/user/components/ChangePasswordForm';
import { ProfileForm } from '@/features/user/components/ProfileForm';
import { useCurrentUser } from '@/features/user/hooks/useUserQueries';
import { toApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';

interface ProfileCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

function ProfileCard({ title, description, children }: ProfileCardProps) {
  return (
    <section className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function ProfilePage() {
  // ProtectedRoute guarantees a session; the query refreshes the cached user in the background
  const storedUser = useAuthStore((state) => state.user);
  const currentUserQuery = useCurrentUser();
  const user = currentUserQuery.data ?? storedUser;

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-16 place-items-center rounded-xl bg-asphalt font-display text-2xl font-bold text-white"
        >
          {getInitials(user)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-4xl font-bold">
            {user.firstName} {user.lastName}
          </h1>
          <p className="truncate text-muted">{user.email}</p>
        </div>
      </div>

      {currentUserQuery.isError && (
        <div
          role="alert"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-paper px-4 py-3 text-sm"
        >
          <span>Güncel bilgiler alınamadı: {toApiError(currentUserQuery.error).message}</span>
          <Button variant="secondary" onClick={() => void currentUserQuery.refetch()}>
            Tekrar dene
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
        <ProfileCard
          title="Kişisel bilgiler"
          description="Alıcıların ilanlarında göreceği bilgiler."
        >
          <ProfileForm user={user} />
        </ProfileCard>
        <ProfileCard
          title="Şifre değiştir"
          description="Hesabının güvenliği için güçlü bir şifre seç."
        >
          <ChangePasswordForm />
        </ProfileCard>
      </div>
    </div>
  );
}
