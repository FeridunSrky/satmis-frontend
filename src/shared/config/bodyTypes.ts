// Matches the backend BodyType enum; slugs are the Turkish URL values used in ?kasa=
export const BODY_TYPES = [
  { value: 'SEDAN', slug: 'sedan', label: 'Sedan', description: 'Dört kapı, ayrı bagaj' },
  {
    value: 'HATCHBACK',
    slug: 'hatchback',
    label: 'Hatchback',
    description: 'Şehir içi, kolay park',
  },
  { value: 'SUV', slug: 'suv', label: 'SUV', description: 'Yüksek sürüş, geniş iç hacim' },
  {
    value: 'STATION_WAGON',
    slug: 'station-wagon',
    label: 'Station wagon',
    description: 'Uzun bagaj, aile yolculuğu',
  },
  { value: 'COUPE', slug: 'coupe', label: 'Coupé', description: 'İki kapı, sportif çizgi' },
  { value: 'CABRIO', slug: 'cabrio', label: 'Cabrio', description: 'Açılır tavan' },
  { value: 'PICKUP', slug: 'pickup', label: 'Pick-up', description: 'Yük kasası, zorlu yol' },
  { value: 'MPV', slug: 'mpv', label: 'MPV', description: 'Yedi koltuğa kadar' },
] as const;

export type BodyType = (typeof BODY_TYPES)[number];

export function findBodyTypeBySlug(slug: string | null): BodyType | undefined {
  return BODY_TYPES.find((bodyType) => bodyType.slug === slug);
}
