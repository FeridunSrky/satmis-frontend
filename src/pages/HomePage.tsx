import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { ButtonLink } from '@/shared/components/Button';
import { PlateMark } from '@/shared/components/PlateMark';
import { BODY_TYPES } from '@/shared/config/bodyTypes';
import { appName } from '@/shared/config/env';

const LISTING_STEPS = [
  {
    title: 'İlanını oluştur',
    text: 'Marka, model, kilometre ve fotoğrafları gir. Fiyatı TL, dolar ya da euro olarak belirle.',
  },
  {
    title: 'Ekibimiz kontrol etsin',
    text: 'Her ilan yayına girmeden önce bilgilerin tutarlılığı açısından incelenir.',
  },
  {
    title: 'Alıcılar seni bulsun',
    text: 'Onaylanan ilan aramalarda görünür. Satıldığında tek tıkla yayından kaldırırsın.',
  },
];

export function HomePage() {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');

  return (
    <>
      <section className="relative overflow-hidden bg-asphalt text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-20 sm:pt-20 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:pb-28">
          <div>
            <h1 className="max-w-xl font-display text-5xl leading-[0.95] font-bold tracking-tight sm:text-7xl">
              Sıradaki aracın bu yolun üstünde.
            </h1>
            <p className="mt-6 max-w-md text-lg text-white/75">
              Sahibinden, galeriden ve yetkili bayiden satılık araçları marka, model ve kasa tipine
              göre karşılaştır.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to="/ilanlar" size="lg">
                Satılık araçları gör
              </ButtonLink>
              {isAuthenticated ? (
                <ButtonLink to="/profil" size="lg" variant="onDark">
                  Profilime git
                </ButtonLink>
              ) : (
                <ButtonLink to="/kayit" size="lg" variant="onDark">
                  Ücretsiz hesap oluştur
                </ButtonLink>
              )}
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <PlateMark
              text={appName.split('.')[0] ?? appName}
              size="lg"
              className="animate-plate-in"
            />
          </div>
        </div>
        <span aria-hidden="true" className="lane-dashes absolute inset-x-0 bottom-8 h-1" />
      </section>

      <section aria-labelledby="body-types-title" className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 id="body-types-title" className="font-display text-3xl font-bold sm:text-4xl">
          Kasa tipine göre göz at
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {BODY_TYPES.map((bodyType) => (
            <li key={bodyType.value}>
              <Link
                to={`/ilanlar?kasa=${bodyType.slug}`}
                className="group flex h-full flex-col rounded-lg border border-line bg-paper p-4 transition-colors hover:border-brand-600"
              >
                <span className="font-display text-2xl font-semibold group-hover:text-brand-700">
                  {bodyType.label}
                </span>
                <span className="mt-1 text-sm text-muted">{bodyType.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="steps-title" className="border-t border-line bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 id="steps-title" className="font-display text-3xl font-bold sm:text-4xl">
            İlanın nasıl yayına girer?
          </h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {LISTING_STEPS.map((step, index) => (
              <li key={step.title} className="border-t-4 border-ink pt-5">
                <span className="font-display text-5xl font-bold text-brand-600">{index + 1}</span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
