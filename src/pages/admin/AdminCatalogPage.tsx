import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { AddCatalogItemForm } from '@/features/admin/components/AddCatalogItemForm';
import { CatalogColumn } from '@/features/admin/components/CatalogColumn';
import {
  useCreateBrand,
  useCreateModel,
  useCreateSeries,
} from '@/features/admin/hooks/useCatalogMutations';
import { useBrands, useModels, useSeries } from '@/features/catalog/hooks/useCatalog';
import { Notice } from '@/shared/components/Notice';

const BRAND_PARAM = 'marka';
const MODEL_PARAM = 'model';
const catalogIdSchema = z.coerce.number().int().positive();

function readId(params: URLSearchParams, name: string): number | undefined {
  const parsed = catalogIdSchema.safeParse(params.get(name));
  return parsed.success ? parsed.data : undefined;
}

export function AdminCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const brandId = readId(searchParams, BRAND_PARAM);
  const modelId = brandId === undefined ? undefined : readId(searchParams, MODEL_PARAM);
  const brandsQuery = useBrands();
  const modelsQuery = useModels(brandId);
  const seriesQuery = useSeries(modelId);
  const createBrand = useCreateBrand();

  // Choosing a brand drops the model: a model belongs to exactly one brand
  const selectBrand = (id: number) => setSearchParams({ [BRAND_PARAM]: String(id) });
  const selectModel = (id: number) =>
    setSearchParams({ [BRAND_PARAM]: String(brandId), [MODEL_PARAM]: String(id) });

  return (
    <section aria-labelledby="admin-catalog-title">
      <h2 id="admin-catalog-title" className="font-display text-3xl font-bold">
        Katalog
      </h2>
      <Notice className="mt-4">
        Katalog kayıtları eklendikten sonra değiştirilemez veya silinemez.
      </Notice>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <CatalogColumn
          title="Markalar"
          query={brandsQuery}
          selectedId={brandId}
          onSelect={(brand) => selectBrand(brand.id)}
        >
          <AddCatalogItemForm
            label="Yeni marka"
            onAdd={(name) => createBrand.mutateAsync(name)}
            onAdded={(brand) => selectBrand(brand.id)}
          />
        </CatalogColumn>
        <CatalogColumn
          title="Modeller"
          placeholder={brandId === undefined ? 'Modelleri görmek için bir marka seçin.' : undefined}
          query={modelsQuery}
          selectedId={modelId}
          onSelect={(model) => selectModel(model.id)}
        >
          {brandId !== undefined && (
            <AddModelForm brandId={brandId} onAdded={(model) => selectModel(model.id)} />
          )}
        </CatalogColumn>
        <CatalogColumn
          title="Seriler"
          placeholder={modelId === undefined ? 'Serileri görmek için bir model seçin.' : undefined}
          query={seriesQuery}
        >
          {modelId !== undefined && <AddSeriesForm modelId={modelId} />}
        </CatalogColumn>
      </div>
    </section>
  );
}

// Keyed by parent so switching brand or model starts with an empty input
function AddModelForm({
  brandId,
  onAdded,
}: {
  brandId: number;
  onAdded: (model: { id: number }) => void;
}) {
  const createModel = useCreateModel(brandId);
  return (
    <AddCatalogItemForm
      key={brandId}
      label="Yeni model"
      onAdd={(name) => createModel.mutateAsync(name)}
      onAdded={onAdded}
    />
  );
}

function AddSeriesForm({ modelId }: { modelId: number }) {
  const createSeries = useCreateSeries(modelId);
  return (
    <AddCatalogItemForm
      key={modelId}
      label="Yeni seri"
      onAdd={(name) => createSeries.mutateAsync(name)}
    />
  );
}
