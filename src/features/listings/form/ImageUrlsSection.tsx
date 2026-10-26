import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/shared/components/Button';
import { TextField } from '@/shared/components/TextField';
import { MAX_IMAGES } from '../listingLimits';
import { FormSection } from './FormSection';
import type { ListingFormInput } from './listingFormSchema';

const PREVIEWABLE_URL = /^https:\/\/\S+$/;

export function ImageUrlsSection() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ListingFormInput>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'imageUrls' });
  const imageUrls = useWatch({ control, name: 'imageUrls' });
  const listError = errors.imageUrls?.message ?? errors.imageUrls?.root?.message;

  return (
    <FormSection
      title="Görseller"
      description="Görsel yükleme yakında. Şimdilik https:// ile başlayan görsel adreslerini ekleyin; ilk görsel kapak olur."
    >
      <ol className="flex flex-col gap-4 sm:col-span-2">
        {fields.map((field, index) => {
          const url = imageUrls[index]?.url.trim() ?? '';
          return (
            <li key={field.id} className="flex gap-3 rounded-xl border border-line p-3">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-md bg-surface text-xs text-muted">
                {PREVIEWABLE_URL.test(url) ? (
                  <img
                    src={url}
                    alt={`Görsel ${index + 1} önizlemesi`}
                    referrerPolicy="no-referrer"
                    className="size-full object-cover"
                  />
                ) : (
                  'Önizleme'
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <TextField
                  label={index === 0 ? 'Görsel 1 (kapak)' : `Görsel ${index + 1}`}
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  error={errors.imageUrls?.[index]?.url?.message}
                  {...register(`imageUrls.${index}.url`)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                    aria-label={`Görsel ${index + 1}: yukarı taşı`}
                  >
                    Yukarı
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label={`Görsel ${index + 1}: aşağı taşı`}
                  >
                    Aşağı
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-danger hover:bg-danger-soft"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                    aria-label={`Görsel ${index + 1}: kaldır`}
                  >
                    Kaldır
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {listError && (
        <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">
          {listError}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button
          variant="secondary"
          disabled={fields.length >= MAX_IMAGES}
          onClick={() => append({ url: '' })}
        >
          Görsel ekle ({fields.length}/{MAX_IMAGES})
        </Button>
      </div>
    </FormSection>
  );
}
