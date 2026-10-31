import { http as mockHttp, HttpResponse } from 'msw/http';
import type { ListingDetail, ListingSummary } from '@/features/listings/types';
import type { PageResponse } from '@/shared/api/types';
import { testUser } from './fixtures';
import { apiUrl, server } from './server';

export const OTHER_SELLER = { id: 99, firstName: 'Mehmet', lastName: 'Kaya', phone: '05559876543' };

export function buildListingSummary(overrides: Partial<ListingSummary> = {}): ListingSummary {
  return {
    id: 7,
    title: 'Hatasız 2019 Clio, bakımları yeni',
    price: 650000,
    currency: 'TRY',
    status: 'ACTIVE',
    createdAt: '2026-10-20T09:00:00Z',
    cityName: 'İstanbul',
    districtName: 'Kadıköy',
    brandName: 'Renault',
    modelName: 'Clio',
    seriesName: '1.0 TCe',
    modelYear: 2019,
    kilometer: 85000,
    fuelType: 'GASOLINE',
    gearType: 'MANUAL',
    coverImageUrl: null,
    ...overrides,
  };
}

export function buildListingDetail(overrides: Partial<ListingDetail> = {}): ListingDetail {
  return {
    id: 7,
    version: 1,
    title: 'Hatasız 2019 Clio, bakımları yeni',
    description: 'Tüm bakımları yetkili serviste yapıldı.',
    price: 650000,
    currency: 'TRY',
    status: 'ACTIVE',
    rejectionReason: null,
    viewCount: 42,
    favoriteCount: 3,
    favoritedByMe: false,
    createdAt: '2026-10-20T09:00:00Z',
    updatedAt: '2026-10-21T09:00:00Z',
    seller: OTHER_SELLER,
    location: { cityId: 34, cityName: 'İstanbul', districtId: 341, districtName: 'Kadıköy' },
    vehicle: {
      brandId: 13,
      brandName: 'Renault',
      modelId: 131,
      modelName: 'Clio',
      seriesId: 1311,
      seriesName: '1.0 TCe',
      modelYear: 2019,
      kilometer: 85000,
      fuelType: 'GASOLINE',
      gearType: 'MANUAL',
      bodyType: 'HATCHBACK',
      color: 'Beyaz',
      enginePower: 90,
      engineCapacity: 999,
      traction: 'FWD',
      vehicleCondition: 'USED',
      fromWho: 'OWNER',
      hasDamageRecord: false,
      exchangeable: true,
    },
    images: [
      { id: 2, url: 'https://cdn.example.com/clio-2.jpg', displayOrder: 1, cover: false },
      { id: 1, url: 'https://cdn.example.com/clio-1.jpg', displayOrder: 0, cover: true },
    ],
    ...overrides,
  };
}

export const ownListingOverrides = {
  seller: {
    id: testUser.id,
    firstName: testUser.firstName,
    lastName: testUser.lastName,
    phone: testUser.phone,
  },
};

export function buildPage<TItem>(content: TItem[], totalPages = 1): PageResponse<TItem> {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages };
}

export interface CatalogRequestLog {
  modelRequests: string[];
  seriesRequests: string[];
  districtRequests: string[];
}

/** A tiny catalog (Renault → Clio → 1.0 TCe, İstanbul → Kadıköy) that records child lookups. */
export function mockCatalog(): CatalogRequestLog {
  const log: CatalogRequestLog = { modelRequests: [], seriesRequests: [], districtRequests: [] };
  server.use(
    mockHttp.get(apiUrl('/catalog/brands'), () =>
      HttpResponse.json([
        { id: 2, name: 'BMW' },
        { id: 13, name: 'Renault' },
      ]),
    ),
    mockHttp.get(apiUrl('/catalog/brands/:brandId/models'), ({ params }) => {
      log.modelRequests.push(String(params.brandId));
      return HttpResponse.json(
        params.brandId === '13' ? [{ id: 131, name: 'Clio' }] : [{ id: 21, name: '3 Serisi' }],
      );
    }),
    mockHttp.get(apiUrl('/catalog/models/:modelId/series'), ({ params }) => {
      log.seriesRequests.push(String(params.modelId));
      return HttpResponse.json([{ id: 1311, name: '1.0 TCe' }]);
    }),
    mockHttp.get(apiUrl('/catalog/cities'), () =>
      HttpResponse.json([
        { id: 6, name: 'Ankara' },
        { id: 34, name: 'İstanbul' },
      ]),
    ),
    mockHttp.get(apiUrl('/catalog/cities/:cityId/districts'), ({ params }) => {
      log.districtRequests.push(String(params.cityId));
      return HttpResponse.json([{ id: 341, name: 'Kadıköy' }]);
    }),
  );
  return log;
}
