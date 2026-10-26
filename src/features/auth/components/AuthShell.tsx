import type { ReactNode } from 'react';
import { PlateMark } from '@/shared/components/PlateMark';
import { appName } from '@/shared/config/env';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const ACCOUNT_BENEFITS = [
  'Beğendiğin ilanları favorilerine ekle',
  'Aracını ilana koy, kontrol edildikten sonra yayına girsin',
  'İletişim bilgilerini tek yerden güncel tut',
];

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:py-14 lg:grid-cols-[0.9fr_1fr] lg:gap-0">
      <aside className="relative hidden overflow-hidden rounded-l-2xl bg-asphalt p-10 text-white lg:block">
        <PlateMark text={appName.split('.')[0] ?? appName} />
        <p className="mt-10 max-w-xs font-display text-3xl leading-tight font-semibold">
          Hesabınla ilanlarını ve aramalarını tek yerden yönet.
        </p>
        <ul className="mt-8 space-y-4 text-white/80">
          {ACCOUNT_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex gap-3">
              <span aria-hidden="true" className="mt-2.5 h-1 w-4 shrink-0 bg-lane" />
              {benefit}
            </li>
          ))}
        </ul>
        <span aria-hidden="true" className="lane-dashes absolute inset-x-0 bottom-8 h-1" />
      </aside>

      <section className="rounded-2xl border border-line bg-paper p-6 sm:p-10 lg:rounded-l-none">
        <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <div className="mt-8 border-t border-line pt-6 text-sm text-muted">{footer}</div>
      </section>
    </div>
  );
}
