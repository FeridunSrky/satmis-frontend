import type { SubmitEvent } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { Button } from '@/shared/components/Button';
import { FormAlert } from '@/shared/components/FormAlert';
import { Notice } from '@/shared/components/Notice';
import { TextAreaField } from '@/shared/components/TextAreaField';
import { TextField } from '@/shared/components/TextField';
import { CURRENCY_LABELS } from '@/shared/config/vehicleLabels';
import { formatKilometer, formatPrice } from '@/shared/lib/format';
import type { ListingDetail } from '../types';
import { SALE_NOTE_HINT, SALE_PUBLIC_NOTICE } from './saleCopy';
import { salePriceRange } from './salePrice';
import {
  formatSaleRange,
  MAX_SALE_NOTE_LENGTH,
  type SaleFormInput,
  type SaleFormOutput,
} from './saleSchema';

interface SaleFormProps {
  listing: ListingDetail;
  form: UseFormReturn<SaleFormInput, unknown, SaleFormOutput>;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
  onCancel: () => void;
}

export function SaleForm({ listing, form, onSubmit, onCancel }: SaleFormProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const remaining = MAX_SALE_NOTE_LENGTH - useWatch({ control, name: 'note' }).length;
  const range = formatSaleRange(salePriceRange(listing.price), listing.currency);

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-5">
      <FormAlert message={errors.root?.server?.message} />
      <SaleListingSummary listing={listing} />
      <TextField
        label={`Satış fiyatı (${CURRENCY_LABELS[listing.currency]})`}
        inputMode="decimal"
        autoComplete="off"
        hint={`İlan fiyatının %80'i ile %110'u arasında olmalı: ${range}`}
        error={errors.salePrice?.message}
        {...register('salePrice')}
      />
      <TextAreaField
        label="Satış açıklaması (isteğe bağlı)"
        maxLength={MAX_SALE_NOTE_LENGTH}
        hint={`${remaining} karakter kaldı. ${SALE_NOTE_HINT}`}
        error={errors.note?.message}
        {...register('note')}
      />
      <Notice>{SALE_PUBLIC_NOTICE}</Notice>
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Vazgeç
        </Button>
        <Button type="submit">Satışı kaydet</Button>
      </div>
    </form>
  );
}

function SaleListingSummary({ listing }: { listing: ListingDetail }) {
  const { vehicle } = listing;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-surface p-4 text-sm">
      <div className="col-span-2">
        <dt className="sr-only">İlan</dt>
        <dd className="font-semibold">{listing.title}</dd>
      </div>
      <div className="col-span-2">
        <dt className="sr-only">Araç</dt>
        <dd className="text-muted">
          {vehicle.brandName} {vehicle.modelName} {vehicle.seriesName}
        </dd>
      </div>
      <div>
        <dt className="text-muted">Model yılı</dt>
        <dd className="font-semibold">{vehicle.modelYear}</dd>
      </div>
      <div>
        <dt className="text-muted">Kilometre</dt>
        <dd className="font-semibold">{formatKilometer(vehicle.kilometer)}</dd>
      </div>
      <div className="col-span-2">
        <dt className="text-muted">İlan fiyatı</dt>
        <dd className="font-semibold">{formatPrice(listing.price, listing.currency)}</dd>
      </div>
    </dl>
  );
}
