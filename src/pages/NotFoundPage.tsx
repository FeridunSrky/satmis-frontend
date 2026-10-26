import { ButtonLink } from '@/shared/components/Button';
import { PlateMark } from '@/shared/components/PlateMark';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-20 text-center">
      <PlateMark text="404" size="lg" />
      <h1 className="mt-10 font-display text-4xl font-bold">Bu sayfa bulunamadı</h1>
      <p className="mt-3 text-muted">Adres yanlış yazılmış ya da sayfa kaldırılmış olabilir.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/">Ana sayfaya dön</ButtonLink>
        <ButtonLink to="/ilanlar" variant="secondary">
          Satılık araçları gör
        </ButtonLink>
      </div>
    </div>
  );
}
