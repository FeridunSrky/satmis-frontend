export const SOLD_VEHICLES_PATH = '/satilmis-araclar';

export function soldVehiclePath(listingId: number): string {
  return `${SOLD_VEHICLES_PATH}/${listingId}`;
}
