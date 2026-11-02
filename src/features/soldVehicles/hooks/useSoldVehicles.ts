import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { soldVehicleKeys } from '@/features/listings/listingKeys';
import { getSalePriceSummary, getSoldVehicle, searchSoldVehicles } from '../api/soldVehiclesApi';
import type { SoldVehicleFilterQuery, SoldVehicleSearchQuery } from '../types';

export function useSoldVehicleSearch(query: SoldVehicleSearchQuery) {
  return useQuery({
    queryKey: soldVehicleKeys.search(query),
    queryFn: () => searchSoldVehicles(query),
    placeholderData: keepPreviousData,
  });
}

/** A separate request, so a slow or failing summary never holds back the list. */
export function useSalePriceSummary(query: SoldVehicleFilterQuery) {
  return useQuery({
    queryKey: soldVehicleKeys.summary(query),
    queryFn: () => getSalePriceSummary(query),
    placeholderData: keepPreviousData,
  });
}

export function useSoldVehicle(listingId: number | null) {
  return useQuery({
    queryKey: soldVehicleKeys.detail(listingId ?? 0),
    queryFn: () => getSoldVehicle(listingId ?? 0),
    enabled: listingId !== null,
  });
}
