import { Link, useSearchParams } from 'react-router-dom';
import { ButtonLink } from '@/shared/components/Button';
import { BODY_TYPES, findBodyTypeBySlug } from '@/shared/config/bodyTypes';
import { cn } from '@/shared/lib/cn';

const BODY_TYPE_PARAM = 'kasa';

function chipClassName(isActive: boolean) {
  return cn(
    'rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
    isActive
      ? 'border-brand-600 bg-brand-600 text-white'
      : 'border-line bg-paper text-ink hover:border-ink/40',
  );
}

// Placeholder until the listing API exists; the ?kasa= filter is already part of the URL contract
export function ListingsPage() {
  const [searchParams] = useSearchParams();
  const selectedBodyType = findBodyTypeBySlug(searchParams.get(BODY_TYPE_PARAM));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">
        {selectedBodyType ? `Satılık ${selectedBodyType.label} araçlar` : 'Satılık araçlar'}
      </h1>

      <nav aria-label="Kasa tipi" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              to="/ilanlar"
              className={chipClassName(!selectedBodyType)}
              aria-current={!selectedBodyType ? 'page' : undefined}
            >
              Tümü
            </Link>
          </li>
          {BODY_TYPES.map((bodyType) => {
            const isActive = bodyType.slug === selectedBodyType?.slug;
            return (
              <li key={bodyType.value}>
                <Link
                  to={`/ilanlar?${BODY_TYPE_PARAM}=${bodyType.slug}`}
                  className={chipClassName(isActive)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {bodyType.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-ink/25 bg-paper px-6 py-16 text-center">
        <span aria-hidden="true" className="lane-dashes h-1 w-24" />
        <h2 className="mt-6 font-display text-3xl font-bold">İlanlar yakında burada olacak</h2>
        <p className="mt-3 max-w-md text-muted">
          İlan sistemi hazırlanıyor. Yayına girdiğinde araçları burada kasa tipine, markaya ve
          fiyata göre filtreleyebileceksin.
        </p>
        <ButtonLink to="/" variant="secondary" className="mt-8">
          Ana sayfaya dön
        </ButtonLink>
      </section>
    </div>
  );
}
